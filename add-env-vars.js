const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const projectId = 'prj_LQxxFd4KnVdCL6frPtnUM4XUdxyP';
const teamId = 'team_h47SJj5rW3drgfwpMh0vtrhk';

const envVars = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    value: 'https://iapvoyhvkzlvpbngwxmq.supabase.co',
    type: 'plain',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhcHZveWh2a3psdnBibmd3eG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDMxMjQsImV4cCI6MjA4NDQxOTEyNH0.qS7N4tfJGS25jHFU1XLPzDRW4zsiIixp-49UzhxMDdk',
    type: 'plain',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'SMARTPING_APP_ID',
    value: 'SX044',
    type: 'plain',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'SMARTPING_PASSWORD',
    value: 'P23GaC6gaU',
    type: 'sensitive',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'NEXT_PUBLIC_SITE_NAME',
    value: 'Toulon La Seyne Tennis de Table',
    type: 'plain',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'NEXT_PUBLIC_SITE_URL',
    value: 'https://tlstt-nextjs.vercel.app',
    type: 'plain',
    target: ['production', 'preview', 'development']
  }
];

async function getVercelToken() {
  try {
    const { stdout } = await execAsync('vercel whoami --token');
    return stdout.trim();
  } catch (error) {
    // Si whoami ne fonctionne pas, on lit directement le fichier de config
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const configPath = path.join(os.homedir(), '.vercel', 'auth.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config.token;
    }
    throw new Error('Token Vercel non trouvé');
  }
}

async function addEnvVar(token, envVar) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(envVar);
    
    const options = {
      hostname: 'api.vercel.com',
      port: 443,
      path: `/v10/projects/${projectId}/env?teamId=${teamId}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`✅ ${envVar.key} ajoutée`);
          resolve(JSON.parse(body));
        } else {
          console.error(`❌ Erreur ${envVar.key}: ${res.statusCode} - ${body}`);
          reject(new Error(`Failed to add ${envVar.key}: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Erreur réseau pour ${envVar.key}:`, error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    console.log('🔑 Récupération du token Vercel...');
    const token = await getVercelToken();
    
    console.log('📦 Ajout des variables d\'environnement...\n');
    
    for (const envVar of envVars) {
      await addEnvVar(token, envVar);
      await new Promise(resolve => setTimeout(resolve, 500)); // Pause 500ms entre chaque requête
    }
    
    console.log('\n✅ Toutes les variables d\'environnement ont été ajoutées !');
    console.log('\n🔄 Redéploiement automatique en cours...');
    console.log('📍 Visite https://tlstt-nextjs.vercel.app dans 2-3 minutes');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();
