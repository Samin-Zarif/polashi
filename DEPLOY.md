# Polashi — Deployment Guide
## Go Live in 4 Steps (Free)

---

## Step 1 — Push to GitHub

1. Go to **github.com** → sign up free → click **New repository**
2. Name it `polashi` → click **Create repository**
3. On your PC, open CMD in the `polashi` folder and run:

```cmd
git init
git add .
git commit -m "Polashi Phase 2"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/polashi.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username.

---

## Step 2 — Deploy the Server on Render (Free)

1. Go to **render.com** → sign up with your GitHub account
2. Click **New** → **Web Service**
3. Select your `polashi` repository
4. Fill in:
   - **Name:** `polashi-server`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Click **Create Web Service**
6. Wait ~2 minutes. You'll get a URL like: `https://polashi-server.onrender.com`
7. Test it: open `https://polashi-server.onrender.com/health` — should show `{"status":"ok"}`

---

## Step 3 — Update the Client with Your Server URL

Open `client/.env.production` and replace the placeholder:

```
VITE_SERVER_URL=https://polashi-server.onrender.com
```

Then push to GitHub:
```cmd
git add .
git commit -m "add server URL"
git push
```

---

## Step 4 — Deploy the Client on Vercel (Free)

1. Go to **vercel.com** → sign up with GitHub
2. Click **Add New Project** → import your `polashi` repository
3. Set the **Root Directory** to `client`
4. Vercel auto-detects Vite — click **Deploy**
5. You'll get a URL like: `https://polashi.vercel.app`

Share that link with your friends in BD — done!

---

## Adding Assets Later

Drop files into the right folders and push to GitHub.
Render and Vercel redeploy automatically.

### Images → `client/public/assets/images/`
| File | Used for |
|------|----------|
| `landing-bg.jpg` | Landing page hero background |
| `war-tent-bg.jpg` | Main game background |
| `night-bg.jpg` | Role reveal / night phase |
| `logo.png` | Header logo / crest |
| `leader-token.png` | Golden leader token icon |

### Role Art → `client/public/assets/images/roles/`
| File | Role |
|------|------|
| `mir-modon.png` | Mir Modon (The Seer) |
| `mohon-lal.png` | Mohon Lal (The Bodyguard) |
| `loyal-soldier.png` | Loyal Soldier |
| `mir-jafar.png` | Mir Jafar (The Assassin) |
| `ghaseti-begum.png` | Ghaseti Begum (The Deceiver) |
| `ray-durlabh.png` | Ray Durlabh (The Hidden) |
| `omichand.png` | Omichand (The Blind) |
| `eic-conspirator.png` | EIC Conspirator |

Recommended size: **400 x 560px**, PNG

### Map Pieces → `client/public/assets/images/map/`
| File | Chapter |
|------|---------|
| `piece-1.png` | Chapter 1 region |
| `piece-2.png` | Chapter 2 region |
| `piece-3.png` | Chapter 3 region |
| `piece-4.png` | Chapter 4 region |
| `piece-5.png` | Chapter 5 — Palashi fort |

### Sounds → `client/public/assets/sounds/`
| File | Plays when |
|------|-----------|
| `nawab-reveal.mp3` | Nawab player sees their role |
| `eic-reveal.mp3` | EIC player sees their role |
| `vote-yes.mp3` | Player clicks Yes |
| `vote-no.mp3` | Player clicks No |
| `vote-pass.mp3` | Team vote passes |
| `vote-fail.mp3` | Team vote rejected |
| `clash-ambience.mp3` | Mission Clash phase (looping) |
| `mission-success.mp3` | Chapter won by Nawab |
| `mission-fail.mp3` | Chapter sabotaged by EIC |
| `assassination.mp3` | Assassination phase begins |
| `nawab-wins.mp3` | Nawab wins the game |
| `eic-wins.mp3` | EIC wins the game |
| `tent-ambience.mp3` | Background loop in war tent |

---

## Render Free Tier Note

The free Render tier **spins down** after 15 minutes of no traffic.
The first person to open the game after inactivity may wait ~30 seconds
for the server to wake up. This is normal on the free plan.

To avoid this: upgrade to Render's $7/month plan, or use Railway.app instead.
