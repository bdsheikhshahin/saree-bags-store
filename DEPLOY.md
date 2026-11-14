# DEPLOY.md — How to put the store live

This guide takes the shop from your computer (`localhost:3000` / `localhost:4000`)
to the real internet. It is written for a non-expert store owner: follow the
steps in order, copy the commands exactly, and replace `yourshop.com.bd` with
your real domain everywhere it appears.

**What you are deploying**

| Part | What it is | Runs on |
| --- | --- | --- |
| `web` | The shop customers see (Next.js) | Vercel, or a VPS with Docker |
| `api` | The server behind the shop (Express + MongoDB) | Render, or a VPS with Docker |
| `mongo` | The database (products, orders, admin login) | MongoDB Atlas (cloud) or Docker on the VPS |

**Recommended simple setup:** web on **Vercel** (free, fast, automatic HTTPS) +
API on **Render** + database on **MongoDB Atlas** (free tier). That is sections
(a) + (c) + (d) below. The VPS option (b) puts everything on one server
instead — cheaper in one bill, but you manage the server yourself.

**Before you start you need**

1. A domain name (for example `yourshop.com.bd`) — optional for testing, required for a real launch. You can test everything first with the free addresses Vercel/Render give you.
2. A MongoDB Atlas account (free) — section (d). Do this first, because both the API and the seed step need the database address.
3. A long random JWT secret (one command, section f).
4. Your admin email + a strong admin password (do NOT reuse the demo login).

> **Payments are not live yet.** The payment code is a stub (Phase 4): no real
> money moves through SSLCommerz / bKash / Nagad today. Customers can place
> Cash on Delivery orders. When the real gateway integration lands, you only
> have to paste live credentials into the API env file and flip
> `SSLCOMMERZ_IS_LIVE` to `true` — no redeploy of the shop design is needed.

---

## 0. Prepare your production secrets (do this once)

On your own computer, in the project folder:

```bash
cd ~/workspace/ecommerce   # or wherever the project lives on your machine

# 1. Make the real env files from the templates (placeholders only in git):
cp apps/web/.env.production.example apps/web/.env.production
cp apps/api/.env.production.example  apps/api/.env.production
```

Then open the two new `.env.production` files and fill in the real values
(the full list with explanations is in section (e)).

```bash
# 2. Generate the JWT secret (admin login signing key) — run once, paste the
#    output as JWT_SECRET in apps/api/.env.production:
openssl rand -base64 48
```

> **Never commit the real `.env.production` files.** They hold passwords and
> keys. Before you put real secrets in them, add these lines to `.gitignore`
> at the project root (they are not there yet):
>
> ```text
> .env.production
> apps/*/.env.production
> ```
>
> And never paste real keys into chat, screenshots, or a shared document.

---

## (a) Web frontend on Vercel

Vercel hosts the shop, gives it HTTPS automatically, and redeploys whenever
you push a code change.

1. Push the project to a GitHub / GitLab / Bitbucket repository (private is fine).
2. Go to <https://vercel.com> → **Add New → Project** → import that repository.
3. In the project settings, set:
   - **Framework Preset:** Next.js (Vercel detects it automatically)
   - **Root Directory:** `apps/web`
   - **Build Command:** leave the default (`npm run build`). If the build fails because dependencies live at the repo root, change it to:
     `cd ../.. && npm run build --workspace=@ecommerce/web`
   - **Install Command:** leave the default — Vercel finds `package-lock.json` at the repo root and installs the whole monorepo.
4. Add these **Environment Variables** (Production). Copy the values from your
   filled-in `apps/web/.env.production`:
   - `NEXT_PUBLIC_SITE_URL` = your shop address, e.g. `https://www.yourshop.com.bd` (while testing, use the `https://<project>.vercel.app` address Vercel gives you)
   - `NEXT_PUBLIC_API_URL` = your API's public address — the Render URL from section (c), e.g. `https://ecommerce-api-xxxx.onrender.com`
   - `NEXT_PUBLIC_GTM_ID` = your GTM container ID, e.g. `GTM-ABCDE12` (leave as `GTM-XXXXXXX` if you have not set up Google Tag Manager yet)
   - `NEXT_PUBLIC_GA_CONSENT_DEFAULT` = `denied`
5. Click **Deploy**. When it finishes, open the Vercel URL — you should see the shop homepage. Products will appear only after the API + database are up and seeded (sections c, d, g).

> **Gotcha — rebuild after changing a `NEXT_PUBLIC_*` value.** These values are
> baked into the website when it is built. Changing one in the Vercel dashboard
> does nothing until you redeploy (Vercel redeploys automatically when you save
> a variable — check the Deployments tab). The same rule applies to Docker
> (section b): rebuild the `web` image after changing them.

To use your own domain later: Vercel project → **Settings → Domains** → add
`www.yourshop.com.bd`, then add the DNS record Vercel shows you at your domain
provider. Update `NEXT_PUBLIC_SITE_URL` and the API's `CORS_ORIGIN` to the new
domain and redeploy.

---

## (b) Everything on a VPS with Docker Compose

Use this if you want one server for the shop + API + database, instead of
Vercel + Render + Atlas. Any Ubuntu 22.04 / 24.04 VPS works (1 GB RAM minimum,
2 GB recommended).

### b.1 Install Docker on the VPS

```bash
# On the VPS, as a user with sudo:
sudo apt-get update && sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER   # log out and back in for this to take effect
docker compose version          # should print a version number
```

Open the firewall ports for the shop and the API (and SSH, so you don't lock
yourself out):

```bash
sudo ufw allow 22/tcp && sudo ufw allow 3000/tcp && sudo ufw allow 4000/tcp
sudo ufw enable
```

### b.2 Copy the project to the VPS

```bash
# From your own computer (replace <vps-ip> and <user>):
scp -r ~/workspace/ecommerce <user>@<vps-ip>:~/ecommerce
# Do NOT copy node_modules or .data — they are large and machine-specific.
# If you use git, `git clone <your-repo-url> ~/ecommerce` on the VPS is better.
```

### b.3 Create the production env files on the VPS

```bash
cd ~/ecommerce
cp apps/web/.env.production.example apps/web/.env.production
cp apps/api/.env.production.example  apps/api/.env.production
nano apps/web/.env.production   # fill in the real values, save with Ctrl+O, Enter, Ctrl+X
nano apps/api/.env.production   # same here
```

For the VPS setup use these values:

- Web file: `NEXT_PUBLIC_SITE_URL=http://<your-vps-ip>:3000` (or your domain once you have one), `NEXT_PUBLIC_API_URL=http://<your-vps-ip>:4000`.
- API file: `MONGO_URI` can stay as the Atlas address (section d) **or** the Docker database — `docker-compose.yml` already overrides it to `mongodb://mongo:27017/ecommerce`, so either works. `CORS_ORIGIN` must be the exact store address, e.g. `http://<your-vps-ip>:3000`.

Because `NEXT_PUBLIC_*` values are baked in at build time, set them **before**
building (or pass them to the build command):

```bash
NEXT_PUBLIC_API_URL=http://<your-vps-ip>:4000 NEXT_PUBLIC_SITE_URL=http://<your-vps-ip>:3000 docker compose up -d --build
```

### b.4 Start, seed, verify

```bash
cd ~/ecommerce
docker compose up -d --build     # build the image and start web + api + mongo
docker compose ps                 # all three should say "healthy" / "running"
docker compose logs -f api        # look for "MongoDB connected" (Ctrl+C to stop watching)

# Seed the database ONCE (first time only — see the warning in section g):
docker compose exec api npm run seed --workspace=@ecommerce/api

# Verify from the VPS:
curl http://localhost:4000/health        # {"ok":true,"service":"ecommerce-api"}
curl http://localhost:4000/api/products  # a list of products (JSON)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/   # 200
```

Now open `http://<your-vps-ip>:3000` in your browser — the shop should load
with products.

**Useful commands**

```bash
docker compose ps                  # status of all services
docker compose logs -f web         # live logs of the shop (Ctrl+C to stop)
docker compose logs -f api         # live logs of the API
docker compose restart web         # restart just the shop
docker compose down                # stop everything (data is kept in the mongo-data volume)
docker compose down -v             # ⚠️ stop AND DELETE the database — never run in production
docker compose up -d --build web   # rebuild + restart only the shop (after a NEXT_PUBLIC_* change)
```

**Going further (optional, after the shop works):** put an Nginx reverse proxy
in front of ports 3000/4000 with a free HTTPS certificate (`certbot`), so the
shop is `https://www.yourshop.com.bd` and the API is `https://api.yourshop.com.bd`.
Then update `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL` and `CORS_ORIGIN` to
the `https://` addresses and rebuild. Port 27017 (MongoDB) is already bound to
`127.0.0.1` only — it is never reachable from the internet.

---

## (c) API on Render

Render runs the API server. It has no database of its own, so you must use
MongoDB Atlas (section d) as the database.

1. Push the project to GitHub / GitLab / Bitbucket.
2. Go to <https://dashboard.render.com> → **New → Web Service** → connect the repository.
3. Settings:
   - **Runtime:** Node
   - **Build Command:** `npm ci && npm run build --workspace=@ecommerce/shared && npm run build --workspace=@ecommerce/api`
   - **Start Command:** `npm start --workspace=@ecommerce/api`
   - **Instance Type:** Free (fine for testing; note the free instance sleeps after inactivity, so the first request after a pause takes ~30–60 seconds — upgrade to Starter for a live shop).
4. Add these **Environment Variables** (copy the values from your filled-in `apps/api/.env.production`):
   `PORT=4000`, `MONGO_URI` (your Atlas string), `JWT_SECRET` (the long random
   secret from section 0), `JWT_EXPIRES_IN=7d`, `CORS_ORIGIN` (your Vercel
   shop address, e.g. `https://www.yourshop.com.bd`), `ADMIN_EMAIL`,
   `ADMIN_PASSWORD`, plus the payment placeholders (`SSLCOMMERZ_STORE_ID`,
   `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_IS_LIVE=false`, `BKASH_APP_KEY`,
   `BKASH_APP_SECRET`, `NAGAD_MERCHANT_ID`).
5. Click **Create Web Service**. When it is live, Render gives you a URL like
   `https://ecommerce-api-xxxx.onrender.com`. Test it:
   `curl https://<your-api>.onrender.com/health` → `{"ok":true,"service":"ecommerce-api"}`
6. Paste that URL as `NEXT_PUBLIC_API_URL` in Vercel (section a) and redeploy the shop.
7. Seed the database once (section g) — from your own computer, with `MONGO_URI` pointed at Atlas, or with a one-off Render Shell session.

> Alternative: Render can also build the `Dockerfile` in this repo ("Docker"
> runtime). The image's default command runs both the API and the web app in
> one container, which works but wastes the web half on Render — the Node
> runtime above is the cleaner choice.

---

## (d) MongoDB Atlas setup (cloud database)

Use Atlas for the Vercel + Render setup, and for the VPS if you prefer a
managed database over the Docker one.

1. Create a free account at <https://www.mongodb.com/cloud/atlas> → **Create a cluster** → choose the **M0 (free)** tier, provider AWS, region closest to Bangladesh (e.g. `ap-south-1` Mumbai or `ap-southeast-1` Singapore).
2. **Database Access → Add New Database User:** username + a strong password, role **Read and write to any database**. Save the password — you need it in the connection string.
3. **Network Access → Add IP Address:** for setup/testing use **Allow Access from Anywhere** (`0.0.0.0/0`). For a live shop you can later restrict it to your Render/VPS IP addresses.
4. **Database → Connect → Drivers (Node.js):** copy the connection string. It looks like:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   Replace `<username>` and `<password>` with the database user from step 2, and add the database name after `.net/`:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ecommerce?retryWrites=true&w=majority`
5. Paste that full string as `MONGO_URI` in the API env (Render dashboard, or `apps/api/.env.production` on the VPS). Keep the `ecommerce` database name — the code uses it everywhere.

---

## (e) All environment variables for production

### Web — `apps/web/.env.production` (also: Vercel dashboard)

| Variable | Required? | Example / notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes | `https://www.yourshop.com.bd` — public shop address, no trailing slash. Used for SEO links. |
| `NEXT_PUBLIC_API_URL` | Yes | `https://api.yourshop.com.bd` — public API address the visitor's browser calls. **Baked in at build time — rebuild after changing.** |
| `NEXT_PUBLIC_GTM_ID` | No | `GTM-ABCDE12` — Google Tag Manager container for GA4. Leave `GTM-XXXXXXX` (or empty) to keep analytics off. |
| `NEXT_PUBLIC_GA_CONSENT_DEFAULT` | No | `denied` — keep this; the cookie banner asks the visitor before tracking. |

### API — `apps/api/.env.production` (also: Render dashboard / VPS env file)

| Variable | Required? | Example / notes |
| --- | --- | --- |
| `PORT` | No (default 4000) | `4000` |
| `MONGO_URI` | Yes | Atlas `mongodb+srv://…/ecommerce?...` or Docker `mongodb://mongo:27017/ecommerce` |
| `JWT_SECRET` | Yes | Long random string, 32+ chars. Generate: `openssl rand -base64 48`. Never reuse the demo value. |
| `JWT_EXPIRES_IN` | No (default 7d) | `7d` — admin login validity |
| `CORS_ORIGIN` | Yes | `https://www.yourshop.com.bd` — exact shop address, no trailing slash. Must match the live store or the shop cannot load products. |
| `ADMIN_EMAIL` | For seeding | `admin@yourshop.com.bd` — set **before** seeding production |
| `ADMIN_PASSWORD` | For seeding | Strong password — set **before** seeding production |
| `SSLCOMMERZ_STORE_ID` | Later (Phase 4) | Live store ID from your SSLCommerz merchant panel |
| `SSLCOMMERZ_STORE_PASSWORD` | Later (Phase 4) | Live store password from SSLCommerz |
| `SSLCOMMERZ_IS_LIVE` | Later (Phase 4) | `false` = sandbox/test, `true` = live. Keep `false` until you are ready to take real payments. |
| `BKASH_APP_KEY` | Later (Phase 4) | bKash app key (sandbox key while testing, live key when going live) |
| `BKASH_APP_SECRET` | Later (Phase 4) | bKash app secret (same rule as above) |
| `NAGAD_MERCHANT_ID` | Later (Phase 4) | Nagad merchant ID (sandbox ID while testing, live ID when going live) |

> **bKash / Nagad have no sandbox/live switch in the code** — only SSLCommerz
> has `SSLCOMMERZ_IS_LIVE`. For bKash and Nagad, sandbox vs live is decided by
> *which* credentials you paste. Do not invent extra variables for them.

---

## (f) What changes from localhost → production

| Thing | On localhost | In production |
| --- | --- | --- |
| Shop address | `http://localhost:3000` | Your domain, e.g. `https://www.yourshop.com.bd` (`NEXT_PUBLIC_SITE_URL`) |
| API address | `http://localhost:4000` | Public API URL, e.g. `https://api.yourshop.com.bd` (`NEXT_PUBLIC_API_URL`) — **and rebuild the web app after changing it** |
| Database | `mongodb://localhost:27017/ecommerce` | Atlas `mongodb+srv://…` string, or `mongodb://mongo:27017/ecommerce` in Docker Compose |
| `CORS_ORIGIN` | `http://localhost:3000` | Exact live shop address — must match, or products/orders fail with a CORS error |
| `JWT_SECRET` | Demo placeholder | Fresh long random secret (`openssl rand -base64 48`) — never reuse the local one |
| Admin login | Demo `admin@shop.local` account | Your own `ADMIN_EMAIL` / `ADMIN_PASSWORD`, set **before** seeding (section g) |
| Payment keys | Empty / sandbox | Sandbox keys while testing → live keys when launching; `SSLCOMMERZ_IS_LIVE=false` → `true` only for the real launch |
| Ports | 3000 / 4000 open on your PC | VPS: only 3000/4000 (or 80/443 behind a proxy) open; MongoDB stays on `127.0.0.1` only |

**Checklist before you tell customers the shop is live:** ☐ shop loads on the
real domain ☐ products show (not an empty page) ☐ you can log in at
`/admin` with the new admin account ☐ a test Cash on Delivery order goes
through ☐ `JWT_SECRET` is random and secret ☐ real `.env.production` files
are NOT in git ☐ payment keys are still sandbox until the Phase 4 launch.

---

## (g) Seed the production database & verify

> ⚠️ **The seed WIPES the shop data first** — it deletes all products,
> categories and blog posts, then inserts the 18 demo products, categories,
> blog posts and default homepage sections, and creates/updates the admin
> account. Run it **once, on a fresh database**. Never run it on a live shop
> that already has real products or orders — you would delete them.

**On the VPS (Docker):**

```bash
cd ~/ecommerce
docker compose exec api npm run seed --workspace=@ecommerce/api
# Expected output ends with: Admin account ready: <your ADMIN_EMAIL>
```

**For Render + Atlas (from your own computer):**

```bash
cd apps/api
MONGO_URI='mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ecommerce?retryWrites=true&w=majority' \
ADMIN_EMAIL='admin@yourshop.com.bd' \
ADMIN_PASSWORD='<your-strong-password>' \
npm run seed
```

(Admin env vars must be set **before** seeding — the seed reads them at that
moment. If you seed first and change them later, the admin account keeps the
old values; run the seed again on the fresh database, or change the password
in the admin panel.)

**Verify health — run these and compare:**

```bash
# 1. API is up:
curl https://<your-api>/health
# → {"ok":true,"service":"ecommerce-api"}

# 2. Products come from the database:
curl https://<your-api>/api/products | head -c 300
# → JSON containing product names (e.g. Jamdani sarees). Empty "[]" means the
#   seed has not run yet (or ran against a different database).

# 3. Homepage sections (Exclusive Offer, Trendy Products, Hot Sale, Best Selling):
curl https://<your-api>/api/sections | head -c 300

# 4. Shop homepage loads:
curl -s -o /dev/null -w "%{http_code}\n" https://www.yourshop.com.bd/
# → 200

# 5. In the browser: open the shop, check products and images load, then open
#    https://www.yourshop.com.bd/admin and log in with your ADMIN_EMAIL.
```

> **Important:** `GET /health` returns `ok: true` even if MongoDB is down —
> the API falls back to built-in demo data so the shop never shows a blank
> error page. So a green health check alone does NOT prove the database is
> connected. Always also check the API logs for `MongoDB connected` and check
> that `/api/products` returns your seeded products:
>
> ```bash
> docker compose logs api | grep -i mongo        # VPS
> # Render: Dashboard → your service → Logs → search "MongoDB connected"
> ```
>
> If you see `MongoDB not available — API will serve seed data as a fallback`,
> the shop is showing demo data, not your database — fix `MONGO_URI` (wrong
> password, wrong cluster address, or Atlas Network Access blocking the IP).

---

## Troubleshooting

| Symptom | Most likely cause | Fix |
| --- | --- | --- |
| Shop loads but no products / "Failed to fetch" | `NEXT_PUBLIC_API_URL` wrong, or the web image was built before you set it | Set the public API URL and **rebuild** the web app (Vercel: redeploy; VPS: `docker compose up -d --build web`) |
| `Access-Control-Allow-Origin` / CORS error in browser console | `CORS_ORIGIN` does not exactly match the shop address | Set `CORS_ORIGIN` to the exact shop URL (no trailing slash) and restart the API |
| API log: `MongoDB not available` | Wrong `MONGO_URI`, or Atlas blocking the IP | Check password/cluster in the Atlas string; Atlas → Network Access → allow `0.0.0.0/0` (or your server IP) |
| `docker compose up` fails: env file not found | `.env.production` files not created on the VPS | Copy the `.example` files and fill them in (section b.3) |
| Admin login fails after seeding | Seeded with different `ADMIN_EMAIL`/`ADMIN_PASSWORD` than you are typing | Re-seed with the right values on a fresh DB, or reset via the admin panel / database |
| Render free API is slow on first visit | Free instance slept from inactivity | Wait ~30–60s and reload; upgrade to a paid instance for a live shop |
| `docker compose config` complains / Docker not found | Docker not installed in this environment | Install Docker on the VPS (section b.1). Docker is not installed in the dev VM — the compose file is validated on the VPS with `docker compose config` before `up`. |

---

## (h) GitHub + automatic deploys (push → live)

**How it works:** the code lives in a private GitHub repository. Vercel watches
that repo — every push to `main` rebuilds and redeploys the shop automatically.
Render does the same for the API. After the one-time setup below, no manual
upload is ever needed: change code → commit → push → live in a few minutes.

1. **Create the repo and push the code** (from your own computer, or let Muse
   do the push once GitHub is connected):
   ```bash
   cd ~/workspace/ecommerce
   git init -b main
   git add -A
   git commit -m "Initial commit: saree & bags store (Next.js + Express + MongoDB)"
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
   The repo already has `.gitignore` (real `.env` files, `node_modules`,
   `dist`, `.next`, `.data/`, `.tools/` are excluded) and a CI workflow
   (`.github/workflows/ci.yml`) that runs typecheck + build + API tests on
   every push and pull request.
2. **Vercel (shop):** import the repo → Root Directory `apps/web` → add the
   env vars from section (a) → Deploy. From then on, every push to `main`
   auto-deploys the shop.
3. **Render (API):** New → Web Service → connect the same repo → settings
   from section (c). Every push to `main` auto-deploys the API too.
4. **After that:** any future update — new feature, price change, bug fix —
   is just `git commit` + `git push`. Vercel/Render rebuild automatically.
   (Preview deployments: a push to any other branch gives Vercel a preview
   URL to check before merging to `main`.)

> **Never commit real `.env.production` files or keys.** The repo only holds
> `.env.example` placeholder files. Real secrets live in the Vercel / Render
> dashboards (and in `.env.production` on your own machine / VPS only).

---

## Files in this deployment setup

| File | Purpose |
| --- | --- |
| `Dockerfile` | Multi-stage production image (Node 20): install → build shared + API + web → slim runtime image as non-root user. Default command runs both services via `start.sh`; Compose overrides it to one service per container. |
| `start.sh` | Starts the API (background) + web app (foreground) for single-container runs. |
| `.dockerignore` | Keeps `node_modules`, build output, `.data/` and real `.env` files out of the image. |
| `docker-compose.yml` | `web` (3000) + `api` (4000) + `mongo` (MongoDB 7, `127.0.0.1:27017` only, `mongo-data` volume), healthchecks, `MONGO_URI` wired to the `mongo` service. |
| `apps/web/.env.production.example` | Production env template for the storefront (placeholders only). |
| `apps/api/.env.production.example` | Production env template for the API (placeholders only). |
| `DEPLOY.md` | This guide. |

**Not done here (needs the store owner):** real domain + DNS, MongoDB Atlas
account and credentials, GTM/GA4 container ID, live SSLCommerz / bKash / Nagad
merchant credentials (Phase 4), and a hosting account (Vercel / Render / VPS).
Nothing in this repo contains a real password or key — if you ever see one in
a file, rotate it immediately and remove it from git history.
