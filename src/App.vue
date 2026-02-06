<script setup lang="ts">
import { nextTick } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useI18n } from '@/composables/useI18n'
import { useRouter } from '@/composables/useRouter'
import JsonEditor from '@/views/JsonEditor.vue'
import JsonDiffEditor from '@/views/JsonDiffEditor.vue'
import SqlEditor from '@/views/SqlEditor.vue'
import BaseIcon from '@/components/base/BaseIcon.vue'
import ToastContainer from '@/components/base/ToastContainer.vue'

const { isDark, toggleTheme } = useTheme()
const { t, localeLabel, toggleLocale } = useI18n()
const { activeTab } = useRouter()

// Theme toggle with View Transitions API (BewlyCat style)
function handleThemeToggle(e: MouseEvent) {
  // Check if View Transitions API is supported
  const isAppearanceTransition =
    typeof document !== 'undefined' &&
    !!(document as any).startViewTransition &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!isAppearanceTransition) {
    toggleTheme()
    return
  }

  const x = e.clientX
  const y = e.clientY
  const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

  // Inject style to disable all CSS transitions during the animation
  const disableTransitionsStyle = document.createElement('style')
  disableTransitionsStyle.textContent = `
    *, *::before, *::after {
      -webkit-transition: none !important;
      -moz-transition: none !important;
      -o-transition: none !important;
      transition: none !important;
    }
  `
  document.head.appendChild(disableTransitionsStyle)

  // Inject style to disable default view transition animations
  const viewTransitionStyle = document.createElement('style')
  viewTransitionStyle.textContent = `
    ::view-transition-old(root),
    ::view-transition-new(root) {
      animation: none !important;
      mix-blend-mode: normal;
    }
  `
  document.head.appendChild(viewTransitionStyle)

  // Start view transition
  const transition = (document as any).startViewTransition(async () => {
    toggleTheme()
    await nextTick()
  })

  transition.ready.then(() => {
    // Check the NEW theme state (after toggle)
    const isDarkNow = isDark.value

    // Inject z-index style based on direction
    const zIndexStyle = document.createElement('style')
    zIndexStyle.textContent = `
      ::view-transition-old(root) { z-index: ${isDarkNow ? 1 : 9999}; }
      ::view-transition-new(root) { z-index: ${isDarkNow ? 9999 : 1}; }
    `
    document.head.appendChild(zIndexStyle)

    const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`]

    const animation = document.documentElement.animate(
      {
        clipPath: isDarkNow ? clipPath : [...clipPath].reverse(),
      },
      {
        duration: 300,
        easing: 'ease-in-out',
        pseudoElement: isDarkNow ? '::view-transition-new(root)' : '::view-transition-old(root)',
      },
    )

    animation.finished.then(() => {
      zIndexStyle.remove()
    })
  })

  transition.finished.then(() => {
    disableTransitionsStyle.remove()
    viewTransitionStyle.remove()
  })
}
</script>

<template>
  <div class="container">
    <header class="header">
      <div class="header-left">
        <div class="brand" @click="activeTab = 'json'" style="cursor: pointer">
          <BaseIcon name="logo" :size="24" />
          Tools
        </div>

        <nav class="nav-tabs">
          <button
            class="nav-tab"
            :class="{ active: activeTab === 'json' }"
            @click="activeTab = 'json'"
          >
            <BaseIcon name="json" :size="16" />
            {{ t('json') }}
          </button>
          <button
            class="nav-tab"
            :class="{ active: activeTab === 'jsonDiff' }"
            @click="activeTab = 'jsonDiff'"
          >
            <BaseIcon name="diff" :size="16" />
            {{ t('jsonDiff') }}
          </button>
          <button
            class="nav-tab"
            :class="{ active: activeTab === 'sql' }"
            @click="activeTab = 'sql'"
          >
            <BaseIcon name="sql" :size="16" />
            {{ t('sqlFormat') }}
          </button>
        </nav>
      </div>

      <div class="header-right">
        <button class="lang-btn" @click="toggleLocale">
          {{ localeLabel }}
        </button>
        <span class="lang-separator">|</span>
        <a
          class="lang-btn"
          href="https://github.com/youmikuang/tool"
          target="_blank"
          rel="noopener noreferrer"
        >
          <BaseIcon name="github" :size="18" />
        </a>
        <span class="lang-separator">|</span>
        <button
          class="btn-icon theme-btn"
          @click="handleThemeToggle"
          :title="isDark ? t('switchToLight') : t('switchToDark')"
        >
          <BaseIcon v-if="isDark" name="sun" :size="18" />
          <BaseIcon v-else name="moon" :size="18" />
        </button>
      </div>
    </header>

    <main class="main">
      <KeepAlive>
        <JsonEditor v-if="activeTab === 'json'" />
        <jsonDiffEditor v-else-if="activeTab === 'jsonDiff'" />
        <SqlEditor v-else-if="activeTab === 'sql'" />
      </KeepAlive>
    </main>

    <ToastContainer />

    <footer class="footer">
      <div class="footer-content">
        <span class="copyright">Copyright © 2026 GAOHENG</span>
        <span class="footer-links">
          <a href="https://beian.miit.gov.cn">&京ICP备16016944号-3</a>
        </span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: transparent;
}

.header {
  height: 64px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  background: var(--bg-primary);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  height: 100%;
  gap: var(--space-6);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  user-select: none;
  height: 100%;
}

.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  font-family: var(--font-mono);
}

.logo-text {
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.nav-tabs {
  display: flex;
  height: 100%;
  gap: 10px;
}

.nav-tab {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 20px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: 0;
  cursor: pointer;
  transition: color 0.2s;
  gap: 6px;
}

.nav-tab.active {
  color: var(--accent-color);
  font-weight: 600;
}

.nav-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent-color);
  border-radius: 1px;
}

.lang-btn {
  padding: 8px 15px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.lang-btn:hover {
  color: var(--accent-color);
  background: rgba(0, 0, 0, 0.05);
}

[data-theme='dark'] .lang-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.lang-separator {
  color: var(--border-color);
  font-weight: 300;
  user-select: none;
}

.btn-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  font-size: 1.1rem;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.btn-icon:hover {
  color: var(--accent-color);
  background: rgba(0, 0, 0, 0.05);
}

[data-theme='dark'] .btn-icon:hover {
  background: rgba(255, 255, 255, 0.08);
}

.main {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
  background: var(--bg-app);
}

.footer {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--space-6);
  flex-shrink: 0;
}

.footer-content {
  display: flex;
  align-items: center;
  gap: 24px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-links a {
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.2s;
}

.footer-links a:hover {
  color: var(--accent-color);
}
</style>
