# 🚀 DÉPLOIEMENT SUR VERCEL - Instructions

## ✅ **CE QUI EST FAIT**

1. ✅ Repository GitHub créé : https://github.com/Thermopoudre/tlstt-nextjs
2. ✅ Code poussé sur GitHub
3. ✅ Configuration Vercel ajoutée

---

## 🎯 **DÉPLOIEMENT AUTOMATIQUE**

### Option 1 : Via l'interface Vercel (RECOMMANDÉ)

**Étapes à suivre :**

1. **Va sur** : https://vercel.com/new

2. **Connecte ton GitHub** (si pas déjà fait)

3. **Importe le repository `tlstt-nextjs`**
   - Tu devrais le voir dans la liste
   - Clique sur "Import"

4. **Configure le projet** :
   - **Project Name** : `tlstt-production` (ou garde `tlstt-nextjs`)
   - **Framework Preset** : Next.js (détecté automatiquement)
   - **Root Directory** : `.` (racine)
   - **Build Command** : `npm run build` (automatique)
   - **Output Directory** : `.next` (automatique)

5. **Ajoute les variables d'environnement** :
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://iapvoyhvkzlvpbngwxmq.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhcHZveWh2a3psdnBibmd3eG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDMxMjQsImV4cCI6MjA4NDQxOTEyNH0.qS7N4tfJGS25jHFU1XLPzDRW4zsiIixp-49UzhxMDdk
   SMARTPING_APP_ID=SX044
   SMARTPING_PASSWORD=P23GaC6gaU
   NEXT_PUBLIC_SITE_NAME=Toulon La Seyne Tennis de Table
   NEXT_PUBLIC_SITE_URL=https://tlstt-production.vercel.app
   ```

6. **Clique sur "Deploy"**

7. **Attends 2-3 minutes** ⏱️

8. **Récupère l'URL** : `https://tlstt-production.vercel.app` (ou similaire)

---

## 🔗 **URLs IMPORTANTES**

- **Repository GitHub** : https://github.com/Thermopoudre/tlstt-nextjs
- **Dashboard Vercel** : https://vercel.com/thermopoudre
- **Supabase Dashboard** : https://supabase.com/dashboard/project/iapvoyhvkzlvpbngwxmq

---

## ✅ **VÉRIFICATION**

Une fois déployé, vérifie que :
- ✅ Le site s'affiche correctement
- ✅ Le header et footer sont visibles
- ✅ La navigation fonctionne
- ✅ Le logo s'affiche

---

## 📝 **PROCHAINES ÉTAPES**

Après le déploiement :
1. Teste le site en production
2. Partage l'URL avec l'équipe
3. Continue la migration des pages restantes

---

**👉 Va sur https://vercel.com/new et suis les étapes ci-dessus !**
