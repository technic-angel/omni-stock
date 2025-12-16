# Omni-Stock — Human-Readable Roadmap (v1.0)

This roadmap explains the *product vision*, *target users*, and *development trajectory* for Omni-Stock in human terms—no technical jargon.  
This is the north star that aligns engineering, design, and future contributors.

---

# 🎯 PRODUCT VISION

Omni-Stock is a lightweight, fast, vendor-focused inventory management platform designed for:

- **Trading card stores**
- **Video game resellers**
- **Collectible dealers**
- **Pawn shops**
- **Convention vendors**
- **Pop-up sellers**

These users need a simple, reliable system to track:

- items  
- conditions  
- prices  
- quantities  
- images  
- categories  

…without paying for expensive POS or enterprise inventory systems.

**Omni-Stock is meant to feel like a real startup product**, even though it's a portfolio project.

---

# 🧑‍🤝‍🧑 TARGET USERS

### MVP target users (primary audience):
- Solo vendors  
- Small shop owners  
- Event vendors with static inventories  
- Sellers who want a simple dashboard  

### Post-MVP expanded audience:
- Multi-employee vendor organizations  
- Multi-location stores  
- Marketplace-facing storefronts  
- Customer-facing product browsers  

---

# 🏁 MVP GOALS (2–3 weeks)

The MVP focuses on a simple but polished experience:

- User registration + login  
- Single vendor account per user  
- Add items with name, price, condition, category, quantity  
- Upload an image  
- View a table of all items  
- Edit items  
- Delete items  
- Super clean UI (feel like a startup)  
- Hosted backend (Render)  
- Hosted frontend (Vercel)  
- Supabase for DB + Storage  

This MVP is enough to show:

- real full-stack engineering  
- domain-driven backend  
- modern frontend architecture  
- CI/CD workflow  
- ability to own a complete product  

---

# 🔮 POST-MVP ROADMAP (6–8 weeks)

After the MVP, development continues into real startup territory.

## 1. Multi-Vendor Support  
Users can create organizations and invite staff.

## 2. Role-Based Access Control (RBAC)  
- Owner  
- Admin  
- Staff  

Permissions for viewing, editing, and deleting inventory.

## 3. Multiple Images Per Item  
Full gallery, drag-and-drop uploader.

## 4. Search + Filtering  
- Search by name  
- Filter by category  
- Filter by condition  
- Filter by vendor (admin only)

## 5. Pricing History  
Track all price changes for each item.

## 6. Category-Specific Metadata  
Different metadata forms for:
- TCG cards  
- Video games  
- Collectibles  
- Manga/Anime goods  

## 7. Public Vendor Storefront  
Non-authenticated users can view vendor items.

## 8. Customer Accounts (Marketplace Direction)  
Optional marketplace-style browsing.

---

# 🚀 FUTURE (3–6 months)

If this project continues growing, Omni-Stock could support:

- Barcodes / QR codes  
- Mobile app companion  
- Live inventory syncing  
- POS integration  
- Bulk CSV import/export  
- Analytics dashboard  
- Sales history  
- Inventory audit logs  
- Real-time stock alerts  

At this stage, Omni-Stock resembles a real SaaS startup.

---

# 🧭 DESIGN PRINCIPLES

Omni-Stock must always follow 6 design principles:

1. **Simplicity:** easy enough for vendors who hate tech.  
2. **Speed:** no slow dashboards or bloated UIs.  
3. **Visibility:** tables, images, and price fields easy to scan.  
4. **Scalability:** architecture must support features beyond MVP.  
5. **Modularity:** feature-driven frontend and modular backend.  
6. **Professionalism:** clean commits, clean code, clean UIs.

---

# 🛠️ ENGINEERING PRINCIPLES

- Domain-driven backend  
- Feature-driven frontend  
- Image upload pipeline via Supabase  
- Strong testing culture  
- Clean CI/CD  
- Predictable agent behavior  
- Zero business logic in views or components  

---

# 🧪 HOW THIS ROADMAP SUPPORTS HIRING

This roadmap is explicitly designed so a junior engineer can show:

- mastery of React + Django  
- mastery of modern frontend architecture  
- understanding of DDD backend patterns  
- ability to design and build an MVP  
- ability to structure and deliver sprints  
- ability to own deployment & infra (Render + Vercel)  
- ability to scale a codebase cleanly  
- ability to use AI agents responsibly  
- ability to document systems like a senior engineer  

Recruiters and hiring managers will recognize:

- professionalism  
- intentional architecture  
- forward planning  
- code quality maturity  

---

# END OF HUMAN ROADMAP (v1.0)
