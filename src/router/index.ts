import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'json',
      component: () => import('@/views/JsonEditor.vue'),
    },
    {
      path: '/diff',
      name: 'jsonDiff',
      component: () => import('@/views/JsonDiffEditor.vue'),
    },
    {
      path: '/sql',
      name: 'sql',
      component: () => import('@/views/SqlEditor.vue'),
    },
    {
      path: '/time',
      name: 'time',
      component: () => import('@/views/TimeTool.vue'),
    },
    {
      path: '/base64',
      name: 'base64',
      component: () => import('@/views/Base64Tool.vue'),
    },
    {
      path: '/card',
      name: 'card',
      component: () => import('@/views/ImageTool.vue'),
    },
  ],
})

export default router
