// Import all examples from the project examples directory
import adminPanel from '../../../../examples/admin-panel.wire?raw';
import analyticsDashboard from '../../../../examples/analytics-dashboard.wire?raw';
import crmSystem from '../../../../examples/crm-system.wire?raw';
import dashboard from '../../../../examples/dashboard.wire?raw';
import designSystem from '../../../../examples/design-system.wire?raw';
import eCommerce from '../../../../examples/e-commerce.wire?raw';
import landingPage from '../../../../examples/landing-page.wire?raw';
import loginForm from '../../../../examples/login-form.wire?raw';
import messagingApp from '../../../../examples/messaging-app.wire?raw';
import projectManagement from '../../../../examples/project-management.wire?raw';
import settingsPage from '../../../../examples/settings-page.wire?raw';
import socialApp from '../../../../examples/social-app.wire?raw';
import taskManager from '../../../../examples/task-manager.wire?raw';

export interface Example {
  id: string;
  name: string;
  description: string;
  code: string;
}

export const EXAMPLES: Example[] = [
  {
    id: 'login-form',
    name: 'Login Form',
    description: 'Authentication with social login and password reset',
    code: loginForm,
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Analytics dashboard with stats and charts',
    code: dashboard,
  },
  {
    id: 'admin-panel',
    name: 'Admin Panel',
    description: 'Full admin interface with sidebar navigation',
    code: adminPanel,
  },
  {
    id: 'e-commerce',
    name: 'E-Commerce',
    description: 'Product listing, cart, and checkout flow',
    code: eCommerce,
  },
  {
    id: 'messaging-app',
    name: 'Messaging App',
    description: 'Chat interface with conversations list',
    code: messagingApp,
  },
  {
    id: 'settings-page',
    name: 'Settings Page',
    description: 'User settings with tabs and forms',
    code: settingsPage,
  },
  {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'SaaS marketing page with pricing',
    code: landingPage,
  },
  {
    id: 'social-app',
    name: 'Social App',
    description: 'Social media feed with profiles',
    code: socialApp,
  },
  {
    id: 'task-manager',
    name: 'Task Manager',
    description: 'Kanban board and task tracking',
    code: taskManager,
  },
  {
    id: 'project-management',
    name: 'Project Management',
    description: 'Project tracking with timeline views',
    code: projectManagement,
  },
  {
    id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    description: 'Data visualization with multiple charts',
    code: analyticsDashboard,
  },
  {
    id: 'crm-system',
    name: 'CRM System',
    description: 'Customer relationship management',
    code: crmSystem,
  },
  {
    id: 'design-system',
    name: 'Design System',
    description: 'Component library showcase',
    code: designSystem,
  },
];
