{
  description = "WireScript - AI-Native Wireframe Tool";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        # Libraries needed for Electron on NixOS
        electronLibs = with pkgs; [
          # Graphics
          libGL
          libdrm
          mesa

          # X11
          xorg.libX11
          xorg.libXcomposite
          xorg.libXdamage
          xorg.libXext
          xorg.libXfixes
          xorg.libXrandr
          xorg.libxcb
          xorg.libxshmfence

          # GTK/Cairo
          gtk3
          pango
          cairo
          gdk-pixbuf
          glib

          # Audio
          alsa-lib
          pulseaudio

          # Networking
          nss
          nspr

          # Other
          at-spi2-atk
          cups
          dbus
          expat
          libxkbcommon
          systemd
        ];
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js and package managers
            nodejs_20
            pnpm

            # Development tools
            typescript
            nodePackages.typescript-language-server

            # Useful CLI tools
            jq
            watchexec

            # Electron dependencies
            electron
          ] ++ electronLibs;

          # Set up library paths for Electron
          LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath electronLibs;

          # Use Nix electron instead of npm-installed one
          ELECTRON_OVERRIDE_DIST_PATH = "${pkgs.electron}/lib/electron";

          shellHook = ''
            echo "WireScript development environment"
            echo "Node: $(node --version)"
            echo "pnpm: $(pnpm --version)"
            echo ""
            echo "Run 'pnpm install' to install dependencies"
            echo "Run 'pnpm dev' to start development server"
            echo "Run 'pnpm --filter @wirescript/viewer dev' for Electron app"
          '';
        };
      }
    );
}
