/**
 * Seed script for Xtrawrkx Suite — Apps & Modules
 * Product family: Fudge People (CRM), Fudge Work (PM), Fudge Base (Accounts)
 */

const seedData = {
  apps: [
    {
      name: 'Fudge People',
      slug: 'crm',
      description: 'Sales CRM — manage leads, deals, contacts, and your pipeline in one place.',
      category: 'Sales & Marketing',
      basePrice: 49.00,
      icon: '👥',
      color: 'teal',
      order: 1,
      isActive: true,
      features: [
        'Lead Management',
        'Contact Database',
        'Deal Pipeline',
        'Proposals & SOW',
        'Client Accounts',
        'Email Integration',
      ],
      modules: [
        {
          name: 'Core CRM',
          slug: 'crm-core',
          description: 'Contacts, companies, and basic reporting',
          pricePerUser: 5.00,
          isCore: true,
          order: 1,
          icon: '⚙️',
          features: ['Contact Management', 'Company Database', 'Basic Reporting'],
        },
        {
          name: 'Leads & Pipeline',
          slug: 'crm-leads',
          description: 'Track and manage your sales leads and deal pipeline',
          pricePerUser: 10.00,
          isCore: true,
          order: 2,
          icon: '🎯',
          features: ['Lead Capture', 'Lead Scoring', 'Lead Assignment', 'Kanban Pipeline', 'Conversion Tracking'],
        },
        {
          name: 'Proposals',
          slug: 'crm-proposals',
          description: 'Create and send professional proposals and SOWs',
          pricePerUser: 8.00,
          isCore: false,
          order: 3,
          icon: '📄',
          features: ['Proposal Builder', 'SOW Templates', 'PDF Export', 'Status Tracking'],
        },
        {
          name: 'Reports & Analytics',
          slug: 'crm-reports',
          description: 'Advanced reporting and analytics',
          pricePerUser: 8.00,
          isCore: false,
          order: 4,
          icon: '📈',
          features: ['Custom Reports', 'Dashboards', 'Export Data', 'Advanced Analytics'],
        },
      ],
    },

    {
      name: 'Fudge Work',
      slug: 'pm',
      description: 'Project Management — track projects, tasks, and your team in one place.',
      category: 'Productivity',
      basePrice: 39.00,
      icon: '📊',
      color: 'purple',
      order: 2,
      isActive: true,
      features: [
        'Project Tracking',
        'Task Management',
        'Department Scoping',
        'Team Collaboration',
        'Time Tracking',
      ],
      modules: [
        {
          name: 'Core PM',
          slug: 'pm-core',
          description: 'Projects, teams, and basic views',
          pricePerUser: 12.00,
          isCore: true,
          order: 1,
          icon: '⚙️',
          features: ['Project Creation', 'Team Management', 'Basic Views', 'File Storage'],
        },
        {
          name: 'Tasks',
          slug: 'pm-tasks',
          description: 'Advanced task management and tracking',
          pricePerUser: 8.00,
          isCore: true,
          order: 2,
          icon: '✓',
          features: ['Task Creation', 'Subtasks', 'Task Dependencies', 'Task Templates', 'Kanban Board'],
        },
        {
          name: 'Time Tracking',
          slug: 'pm-time',
          description: 'Track time against tasks and projects',
          pricePerUser: 6.00,
          isCore: false,
          order: 3,
          icon: '⏱️',
          features: ['Timer', 'Manual Time Entry', 'Timesheet Reports', 'Billable Hours'],
        },
        {
          name: 'Reports & Analytics',
          slug: 'pm-reports',
          description: 'Project reports and insights',
          pricePerUser: 6.00,
          isCore: false,
          order: 4,
          icon: '📈',
          features: ['Progress Reports', 'Time Reports', 'Resource Allocation', 'Custom Reports'],
        },
      ],
    },

    {
      name: 'Fudge Base',
      slug: 'accounts',
      description: 'Account Management — users, roles, departments, and access in one workspace.',
      category: 'Administration',
      basePrice: 29.00,
      icon: '🛡️',
      color: 'orange',
      order: 3,
      isActive: true,
      features: [
        'User Management',
        'Roles & Permissions',
        'Department Management',
        'Subscriptions',
        'Audit Logs',
      ],
      modules: [
        {
          name: 'Core Accounts',
          slug: 'accounts-core',
          description: 'User profiles, org settings, and basic security',
          pricePerUser: 5.00,
          isCore: true,
          order: 1,
          icon: '⚙️',
          features: ['User Profiles', 'Organization Settings', 'Basic Security'],
        },
        {
          name: 'Departments & Teams',
          slug: 'accounts-departments',
          description: 'Manage departments, teams, and data scoping',
          pricePerUser: 6.00,
          isCore: true,
          order: 2,
          icon: '🏢',
          features: ['Department Management', 'Team Assignments', 'Department-wise Data Scope'],
        },
        {
          name: 'Billing & Subscriptions',
          slug: 'accounts-billing',
          description: 'Manage billing and subscriptions',
          pricePerUser: 8.00,
          isCore: false,
          order: 3,
          icon: '💰',
          features: ['Subscription Plans', 'Billing History', 'Payment Methods', 'Tax Management'],
        },
      ],
    },
  ],
};

async function seed(strapi) {
  console.log('🌱 Starting Xtrawrkx apps & modules seed...');

  const moduleCount = seedData.apps.reduce((sum, a) => sum + a.modules.length, 0);

  for (const rawApp of seedData.apps) {
    const { modules, ...appPayload } = rawApp;
    console.log(`\n📦 Seeding app: ${appPayload.name} (${appPayload.slug})`);

    const existingApp = await strapi.entityService.findMany('api::app.app', {
      filters: { slug: appPayload.slug },
      limit: 1,
    });

    let app;
    if (existingApp && existingApp.length > 0) {
      app = await strapi.entityService.update('api::app.app', existingApp[0].id, { data: appPayload });
      console.log(`   ↺  Updated app: ${appPayload.name}`);
    } else {
      app = await strapi.entityService.create('api::app.app', { data: appPayload });
      console.log(`   ✨ Created app: ${appPayload.name}`);
    }

    for (const moduleData of modules) {
      const existingModule = await strapi.entityService.findMany('api::module.module', {
        filters: { slug: moduleData.slug },
        limit: 1,
      });

      if (existingModule && existingModule.length > 0) {
        await strapi.entityService.update('api::module.module', existingModule[0].id, {
          data: { ...moduleData, app: app.id },
        });
        console.log(`   ↺  Updated module: ${moduleData.name}`);
      } else {
        await strapi.entityService.create('api::module.module', {
          data: { ...moduleData, app: app.id },
        });
        console.log(`   ✨ Created module: ${moduleData.name}`);
      }
    }
  }

  console.log(`\n✅ Apps & modules seed complete — ${seedData.apps.length} apps, ${moduleCount} modules`);
}

module.exports = { seed, seedData };
