const https = require('https');

const teamId = 'team_h47SJj5rW3drgfwpMh0vtrhk';
const repoUrl = 'https://github.com/Thermopoudre/tlstt-nextjs';

// Créer le projet Vercel lié au repo GitHub
const projectData = JSON.stringify({
  name: 'tlstt-production',
  framework: 'nextjs',
  gitRepository: {
    type: 'github',
    repo: 'Thermopoudre/tlstt-nextjs'
  },
  environmentVariables: [
    {
      key: 'NEXT_PUBLIC_SUPABASE_URL',
      value: 'https://iapvoyhvkzlvpbngwxmq.supabase.co',
      target: ['production', 'preview', 'development']
    },
    {
      key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhcHZveWh2a3psdnBibmd3eG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDMxMjQsImV4cCI6MjA4NDQxOTEyNH0.qS7N4tfJGS25jHFU1XLPzDRW4zsiIixp-49UzhxMDdk',
      target: ['production', 'preview', 'development']
    },
    {
      key: 'SMARTPING_APP_ID',
      value: 'SX044',
      target: ['production', 'preview', 'development']
    },
    {
      key: 'SMARTPING_PASSWORD',
      value: 'P23GaC6gaU',
      target: ['production', 'preview', 'development']
    },
    {
      key: 'NEXT_PUBLIC_SITE_NAME',
      value: 'Toulon La Seyne Tennis de Table',
      target: ['production', 'preview', 'development']
    }
  ]
});

console.log('Données du projet:', projectData);
console.log('\n⚠️  Pour déployer automatiquement, tu dois:');
console.log('1. Aller sur https://vercel.com/new');
console.log('2. Importer le repo "Thermopoudre/tlstt-nextjs"');
console.log('3. Les variables d\'environnement seront à ajouter manuellement');
console.log('\nOU utiliser la commande: vercel --prod');
