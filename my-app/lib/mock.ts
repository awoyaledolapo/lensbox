import type { StaticImageData } from "next/image";
import hero1 from "../public/hero-1.jpg";
import hero2 from "../public/hero-2.jpg";
import hero3 from "../public/hero-3.jpg";
import hero4 from "../public/hero-4.jpg";
import hero5 from "../public/hero-5.jpg";
import hero6 from "../public/hero-6.jpg";
import sc1 from "../public/showcase-1.jpg";
import sc2 from "../public/showcase-2.jpg";
import sc3 from "../public/showcase-3.jpg";
import sc4 from "../public/showcase-4.jpg";
import sc5 from "../public/showcase-5.jpg";
import sc6 from "../public/showcase-6.jpg";

export const allImages = [hero1, hero2, hero3, hero4, hero5, hero6, sc1, sc2, sc3, sc4, sc5, sc6];

export type Gallery = {
  id: string;
  title: string;
  client: string;
  cover: StaticImageData;
  photos: number;
  updated: string;
  status: "Active" | "Draft" | "Expired";
  expires: string;
  views: number;
  favorites: number;
  downloads: number;
};

export const galleries: Gallery[] = [
  { id: "harlow-wedding", title: "Harlow & Finn — Coastal Wedding", client: "Harlow Vance", cover: hero1, photos: 248, updated: "2 hours ago", status: "Active", expires: "Aug 14, 2026", views: 1284, favorites: 92, downloads: 41 },
  { id: "atelier-aalto-ss26", title: "Atelier Aalto SS26 Lookbook", client: "Studio Aalto", cover: sc1, photos: 132, updated: "Yesterday", status: "Active", expires: "Jul 02, 2026", views: 612, favorites: 48, downloads: 18 },
  { id: "noma-product-drop", title: "Noma — Spring Object Series", client: "Field Office", cover: sc6, photos: 64, updated: "3 days ago", status: "Draft", expires: "—", views: 0, favorites: 0, downloads: 0 },
  { id: "vidal-residence", title: "Vidal Residence — Architecture", client: "Jonas Vidal", cover: hero2, photos: 96, updated: "1 week ago", status: "Active", expires: "Sep 30, 2026", views: 421, favorites: 27, downloads: 12 },
  { id: "lemaire-editorial", title: "Lemaire Editorial — Quiet Forms", client: "Iris Lemaire", cover: hero4, photos: 58, updated: "2 weeks ago", status: "Active", expires: "Jun 22, 2026", views: 322, favorites: 19, downloads: 9 },
  { id: "bergstrom-rooms", title: "Bergstrom — Quiet Rooms", client: "Noa Bergstrom", cover: hero6, photos: 184, updated: "1 month ago", status: "Expired", expires: "Apr 01, 2026", views: 988, favorites: 71, downloads: 33 },
];

export const recentUploads = [
  { src: hero5, title: "Portrait 04", gallery: "Harlow & Finn", time: "12m ago" },
  { src: sc2, title: "Spiral", gallery: "Atelier Aalto", time: "1h ago" },
  { src: hero3, title: "Object Nº4", gallery: "Noma — Spring", time: "3h ago" },
  { src: sc4, title: "Marble Form", gallery: "Vidal Residence", time: "Yesterday" },
  { src: sc5, title: "Valley at dawn", gallery: "Lemaire Editorial", time: "2 days ago" },
  { src: hero2, title: "Concrete", gallery: "Vidal Residence", time: "3 days ago" },
];
