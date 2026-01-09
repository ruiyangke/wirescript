import {
  ACTION_KEYWORDS_SET,
  type ChildNode,
  type ComponentDef,
  ELEMENT_TYPES_SET,
  type ElementNode,
  isActionRef,
  isOverlayRef,
  isParamRef,
  isScreenRef,
  type OverlayNode,
  type ParseError,
  type PropValue,
  type RepeatNode,
  type ScreenNode,
  VALID_FLAGS_SET,
  type WireDocument,
} from './schema/types.js';

export interface ValidationResult {
  valid: boolean;
  errors: ParseError[];
  warnings: ParseError[];
}

export class Validator {
  private errors: ParseError[] = [];
  private warnings: ParseError[] = [];
  private screenIds = new Set<string>();
  private overlayIds = new Set<string>();
  private componentNames = new Set<string>();
  private layoutNames = new Set<string>();

  validate(document: WireDocument): ValidationResult {
    this.errors = [];
    this.warnings = [];
    this.screenIds.clear();
    this.overlayIds.clear();
    this.componentNames.clear();
    this.layoutNames.clear();

    // Collect component names
    for (const comp of document.components) {
      this.componentNames.add(comp.name);
    }

    // Collect layout names
    for (const layout of document.layouts) {
      this.layoutNames.add(layout.name);
    }

    // Collect screen IDs
    for (const screen of document.screens) {
      if (this.screenIds.has(screen.id)) {
        this.addError(`Duplicate screen ID: '${screen.id}'`, screen.loc?.line, screen.loc?.column);
      }
      this.screenIds.add(screen.id);

      // Collect overlay IDs
      for (const overlay of screen.overlays) {
        if (this.overlayIds.has(overlay.id)) {
          this.addError(
            `Duplicate overlay ID: '${overlay.id}'`,
            overlay.loc?.line,
            overlay.loc?.column
          );
        }
        this.overlayIds.add(overlay.id);
      }
    }

    // Validate components
    for (const comp of document.components) {
      this.validateComponent(comp);
    }

    // Validate screens
    for (const screen of document.screens) {
      this.validateScreen(screen);
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  private validateComponent(comp: ComponentDef): void {
    // Check name doesn't shadow element type
    if (ELEMENT_TYPES_SET.has(comp.name)) {
      this.addError(
        `Component '${comp.name}' shadows built-in element type`,
        comp.loc?.line,
        comp.loc?.column
      );
    }

    // Validate body with component params available
    this.validateElement(comp.body, new Set(comp.params));
  }

  private validateScreen(screen: ScreenNode): void {
    // Validate layout reference
    if (screen.layout && !this.layoutNames.has(screen.layout)) {
      this.addWarning(
        `Reference to unknown layout '${screen.layout}'`,
        screen.loc?.line,
        screen.loc?.column
      );
    }

    // Validate root element
    this.validateElement(screen.root, new Set());

    // Validate overlays
    for (const overlay of screen.overlays) {
      this.validateOverlay(overlay);
    }
  }

  private validateOverlay(overlay: OverlayNode): void {
    // Validate props (flags are now in props)
    this.validateProps(overlay.props, overlay.loc);

    // Validate children
    for (const child of overlay.children) {
      this.validateChild(child, new Set());
    }
  }

  private validateElement(element: ElementNode, availableParams: Set<string>): void {
    const loc = element.loc;

    // Validate element type or component name
    if (
      !ELEMENT_TYPES_SET.has(element.elementType) &&
      !this.componentNames.has(element.elementType)
    ) {
      // Unknown element - could be forward reference or typo
      // Only warn, don't error (forward compatibility)
      this.addWarning(
        `Unknown element type: '${element.elementType}'`,
        loc?.line,
        loc?.column
      );
    }

    // Validate content param refs
    if (element.content && isParamRef(element.content)) {
      if (!availableParams.has(element.content.name)) {
        this.addError(
          `Unknown parameter reference '$${element.content.name}'`,
          loc?.line,
          loc?.column
        );
      }
    }

    // Validate props
    this.validateProps(element.props, loc, availableParams);

    // Validate 'to' navigation target
    const to = element.props.to;
    if (to && typeof to === 'object') {
      this.validateNavigationTarget(to, loc);
    }

    // Validate children
    for (const child of element.children) {
      this.validateChild(child, availableParams);
    }
  }

  private validateChild(child: ChildNode, availableParams: Set<string>): void {
    if (child.type === 'element') {
      this.validateElement(child, availableParams);
    } else if (child.type === 'repeat') {
      this.validateRepeat(child, availableParams);
    }
  }

  private validateRepeat(repeat: RepeatNode, availableParams: Set<string>): void {
    const loc = repeat.loc;

    // Validate count
    if (typeof repeat.count === 'number') {
      if (repeat.count < 1) {
        this.addError('Repeat count must be at least 1', loc?.line, loc?.column);
      }
    } else if (isParamRef(repeat.count)) {
      if (!availableParams.has(repeat.count.name)) {
        this.addError(
          `Unknown parameter reference '$${repeat.count.name}'`,
          loc?.line,
          loc?.column
        );
      }
    }

    // Add loop variable to available params for body
    const bodyParams = new Set(availableParams);
    if (repeat.as) {
      bodyParams.add(repeat.as);
    }

    this.validateElement(repeat.body, bodyParams);
  }

  private validateProps(
    props: Record<string, PropValue>,
    loc?: { line?: number; column?: number },
    availableParams?: Set<string>
  ): void {
    for (const [key, value] of Object.entries(props)) {
      // Warn on unknown flags (boolean props)
      if (value === true && !VALID_FLAGS_SET.has(key)) {
        // Don't warn for known prop names like 'to', 'icon', etc.
        const knownProps = ['to', 'icon', 'src', 'alt', 'placeholder', 'value', 'type', 'id', 'name', 'title', 'label'];
        if (!knownProps.includes(key)) {
          this.addWarning(`Unknown flag ':${key}'`, loc?.line, loc?.column);
        }
      }

      // Validate param refs in values
      if (availableParams && isParamRef(value)) {
        if (!availableParams.has(value.name)) {
          this.addError(
            `Unknown parameter reference '$${value.name}'`,
            loc?.line,
            loc?.column
          );
        }
      }
    }
  }

  private validateNavigationTarget(
    target: PropValue,
    loc?: { line?: number; column?: number }
  ): void {
    if (isScreenRef(target)) {
      if (!this.screenIds.has(target.id)) {
        this.addWarning(`Reference to unknown screen '${target.id}'`, loc?.line, loc?.column);
      }
    } else if (isOverlayRef(target)) {
      if (!this.overlayIds.has(target.id)) {
        this.addWarning(`Reference to unknown overlay '#${target.id}'`, loc?.line, loc?.column);
      }
    } else if (isActionRef(target)) {
      if (!ACTION_KEYWORDS_SET.has(target.action)) {
        this.addError(`Unknown action '${target.action}'`, loc?.line, loc?.column);
      }
    }
    // ParamRef and UrlRef don't need validation here
  }

  private addError(message: string, line?: number, column?: number): void {
    this.errors.push({ message, line: line ?? 0, column: column ?? 0 });
  }

  private addWarning(message: string, line?: number, column?: number): void {
    this.warnings.push({ message, line: line ?? 0, column: column ?? 0 });
  }
}

export function validate(document: WireDocument): ValidationResult {
  return new Validator().validate(document);
}
