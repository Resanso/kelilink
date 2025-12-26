1. Ringkasan Proyek
   Aplikasi web (PWA-ready) yang menghubungkan pembeli dengan penjual makanan keliling secara real-time. Konsepnya mirip ride-hailing (Gojek/Grab) namun berfokus pada pedagang kaki lima yang berpindah-pindah.

2. Tech Stack & Tools
   Frontend framework: Next.js (App Router).

Language: TypeScript.

Styling: Tailwind CSS.

API Layer: tRPC (Type-safe APIs).

Database & Auth: Supabase (PostgreSQL, Auth, Realtime).

Maps: OpenStreetMaps (via react-leaflet).

State Management: React Query (via tRPC) & Zustand (untuk local state map).

3. Database Schema (Supabase Design)
   A. Users & Roles (public.profiles)
   Linked to auth.users.

Fields: id, role ('buyer' | 'vendor'), full_name, avatar_url.

Vendor Specific: current_latitude, current_longitude, is_active (sedang keliling/tidak).

B. Products (public.products)
Fields: id, vendor_id (FK), name, price, image_url, is_available.

C. Orders (public.orders)
Fields: id, buyer_id (FK), vendor_id (FK), status ('pending', 'confirmed', 'delivering', 'completed', 'cancelled'), total_price, created_at.

Logic: Saat status berubah menjadi 'delivering', UI pembeli akan mentracking lokasi vendor.

D. Order Items (public.order_items)
Fields: id, order_id (FK), product_id (FK), quantity, price_at_order.

E. Chat (public.messages)
Fields: id, order_id (FK), sender_id (FK), content, created_at.

Realtime: Enable Supabase Realtime pada tabel ini untuk fitur chat.

4. Fitur Utama & Alur Kerja
   A. Role Pembeli (Buyer)
   Home/Map View: Melihat marker para penjual yang is_active = true di sekitar lokasi user (menggunakan Geo-query sederhana atau filter client-side).

Ordering: Mengklik marker penjual -> Melihat menu -> Add to cart -> Checkout.

Tracking: Setelah pesanan dikonfirmasi penjual, pembeli melihat marker penjual bergerak mendekat (Dummy Simulation).

B. Role Penjual (Vendor)
Dashboard: Toggle Start Selling (mengaktifkan lokasi).

Order Management: Menerima notifikasi pesanan masuk -> Terima/Tolak.

Delivery Simulation: Saat klik "Antar Pesanan", sistem akan mensimulasikan pergerakan lokasi penjual menuju lokasi pembeli.

5. Implementation Strategy (Technical details)
   Dummy Live Location & Movement Logic
   Alih-alih GPS hp asli yang mungkin tidak stabil untuk testing, kita akan membuat "Smoothed Dummy Movement":

Saat status order = delivering.

Frontend akan menghitung rute lurus (atau path sederhana) dari koordinat Vendor ke koordinat Pembeli.

Gunakan setInterval atau requestAnimationFrame untuk mengupdate koordinat vendor (lat, lng) sedikit demi sedikit mendekati pembeli setiap detiknya.

Koordinat baru ini di-update ke Supabase (profiles table) agar pembeli bisa melihat perubahan posisi secara realtime via subscription.

Realtime Features (Supabase)
Chat: Subscribe ke channel messages dengan filter order_id.

Location: Subscribe ke channel profiles dengan filter id=eq.vendor_id untuk update posisi marker di peta.

Order Status: Subscribe ke channel orders untuk update status pesanan live.

6. tRPC Router Structure
   userRouter: getProfile, updateLocation, toggleStatus.

productRouter: getByVendor, create (vendor only).

orderRouter: create, accept, updateStatus, getMyOrders.

chatRouter: sendMessage, getHistory.

7. UI/UX Guidelines
   Map Interface: Peta memenuhi layar (fullscreen) sebagai background utama.

Bottom Sheet/Drawer: Gunakan slide-up panel untuk detail menu dan chat agar tidak menutupi peta.

Notifications: Gunakan toast sederhana untuk status update.
