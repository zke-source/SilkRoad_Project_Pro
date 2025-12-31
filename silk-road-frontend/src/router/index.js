import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../pages/Dashboard.vue'
import ScenicSpots from '../pages/ScenicSpots.vue'
import Hotels from '../pages/Hotels.vue'
import Events from '../pages/Events.vue'
import Devices from '../pages/Devices.vue'
import Login from '../pages/Login.vue'
import Register from '../pages/Register.vue'
import Intelligence from '../pages/Intelligence.vue'
import Search from '../pages/Search.vue'
import ScenicSpotDetail from '../pages/ScenicSpotDetail.vue'
import HotelDetail from '../pages/HotelDetail.vue'
import EventDetail from '../pages/EventDetail.vue'
import Food from '../pages/Food.vue'
import FoodDetail from '../pages/FoodDetail.vue'
import Forum from '../pages/Forum.vue'
import Guides from '../pages/Guides.vue'
import GuideDetail from '../pages/GuideDetail.vue'
import Itinerary from '../pages/Itinerary.vue'
import Admin from '../pages/Admin.vue'
import Profile from '../pages/Profile.vue'

const routes = [
  { path: '/', name: 'dashboard', component: Dashboard },
  { path: '/scenic-spots', name: 'scenic-spots', component: ScenicSpots },
  { path: '/scenic-spots/:id', name: 'scenic-spot-detail', component: ScenicSpotDetail },
  { path: '/hotels', name: 'hotels', component: Hotels },
  { path: '/hotels/:id', name: 'hotel-detail', component: HotelDetail },
  { path: '/events', name: 'events', component: Events },
  { path: '/events/:id', name: 'event-detail', component: EventDetail },
  { path: '/devices', name: 'devices', component: Devices },
  { path: '/login', name: 'login', component: Login },
  { path: '/register', name: 'register', component: Register },
  { path: '/intelligence', name: 'intelligence', component: Intelligence },
  { path: '/search', name: 'search', component: Search },
  { path: '/food', name: 'food', component: Food },
  { path: '/food/:id', name: 'food-detail', component: FoodDetail },
  { path: '/forum', name: 'forum', component: Forum },
  { path: '/guides', name: 'guides', component: Guides },
  { path: '/guides/:id', name: 'guide-detail', component: GuideDetail },
  { path: '/itinerary', name: 'itinerary', component: Itinerary },
  { path: '/admin', name: 'admin', component: Admin },
  { path: '/profile', name: 'profile', component: Profile }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
