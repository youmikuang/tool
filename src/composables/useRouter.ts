import { ref, onMounted, onUnmounted, watch } from 'vue'

export type TabType = 'json' | 'jsonDiff' | 'sql'

export function useRouter() {
  const activeTab = ref<TabType>('json')

  const routeMap: Record<string, TabType> = {
    '/': 'json',
    '/diff': 'jsonDiff',
    '/sql': 'sql',
  }

  const reverseRouteMap: Record<string, string> = {
    json: '/',
    jsonDiff: '/diff',
    sql: '/sql',
  }

  const getTabFromPath = (): TabType => {
    const path = window.location.pathname
    return routeMap[path] || 'json'
  }

  const updatePathFromTab = (tab: TabType) => {
    const newPath = reverseRouteMap[tab]
    if (window.location.pathname !== newPath) {
      history.pushState(null, '', newPath)
    }
  }

  const handlePopState = () => {
    activeTab.value = getTabFromPath()
  }

  onMounted(() => {
    activeTab.value = getTabFromPath()
    window.addEventListener('popstate', handlePopState)
  })

  onUnmounted(() => {
    window.removeEventListener('popstate', handlePopState)
  })

  watch(activeTab, (newTab) => {
    updatePathFromTab(newTab)
  })

  return {
    activeTab,
  }
}
