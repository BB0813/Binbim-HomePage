<template>
  <div class="music-player-wrapper" :style="playerStyle">
    <audio
      ref="audioRef"
      :src="currentSong?.url"
      :loop="loopMode === 'one'"
      preload="auto"
      @ended="onEnded"
      @timeupdate="onTimeUpdate"
      @canplay="onCanPlay"
      @error="onError"
    ></audio>

    <!-- Lyrics Display -->
    <div
      class="lyrics-container"
      v-if="showLyrics"
      :style="lyricsStyle"
      @mousedown="startLyricsDrag"
      @touchstart.prevent="startLyricsDrag"
      @contextmenu.prevent="handleContextMenu"
    >
      <div class="lyrics-wrapper" v-if="currentLyric || nextLyric">
        <transition name="lyric-fade" mode="out-in">
          <div
            :key="currentLyric"
            class="lyric-line current"
            :style="{
              fontSize: lyricsSettings.fontSize + 'px',
              color: lyricsSettings.color
            }"
          >
            {{ currentLyric || '...' }}
          </div>
        </transition>
        <transition name="lyric-fade" mode="out-in">
          <div
            v-if="nextLyric"
            :key="nextLyric"
            class="lyric-line next"
            :style="{
              fontSize: (lyricsSettings.fontSize * 0.75) + 'px',
              color: lyricsSettings.color
            }"
          >
            {{ nextLyric }}
          </div>
        </transition>
      </div>
      <div v-else class="lyrics-placeholder" :style="{ color: lyricsSettings.color }">
        Waiting for lyrics...
      </div>
    </div>

    <!-- Context Menu -->
    <transition name="fade-slide">
      <div
        v-if="contextMenuVisible"
        class="context-menu"
        :style="contextMenuStyle"
        @mousedown.stop
      >
        <div class="menu-header">Settings</div>
        <div class="menu-item">
          <label>Size</label>
          <div class="control-group">
            <input type="range" min="16" max="64" v-model.number="lyricsSettings.fontSize">
            <span class="value">{{ lyricsSettings.fontSize }}px</span>
          </div>
        </div>
        <div class="menu-item">
          <label>Color</label>
          <div class="control-group">
            <input type="color" v-model="lyricsSettings.color">
          </div>
        </div>
      </div>
    </transition>

    <div class="player-widget" :class="{ 'is-playing': isPlaying }" @mousedown="startPlayerDrag" @touchstart.prevent="startPlayerDrag">
      <!-- Album Art & Play Toggle -->
      <div class="cover-container" @click.stop="togglePlay">
        <div class="cover-wrapper">
          <img
            v-if="currentSong?.cover"
            :src="currentSong.cover"
            alt="cover"
            class="cover-img"
            :class="{ 'rotating': isPlaying }"
          />
          <div v-else class="cover-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          </div>
        </div>
      </div>

      <!-- Info & Controls -->
      <div class="content-container">
        <div class="top-row">
          <div class="song-info">
            <span class="song-title" :title="currentSong?.name">{{ currentSong?.name || 'Loading...' }}</span>
            <span class="song-artist" v-if="currentSong?.artist">- {{ currentSong.artist }}</span>
          </div>
          <div class="controls">
            <button class="icon-btn" @click.stop="prev" title="上一首" aria-label="上一首">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
            </button>
            <button class="icon-btn" @click.stop="togglePlay" :title="isPlaying ? '暂停' : '播放'" :aria-label="isPlaying ? '暂停' : '播放'">
               <svg v-if="!isPlaying" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
               <svg v-else aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            </button>
            <button class="icon-btn" @click.stop="next" title="下一首" aria-label="下一首">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
            </button>

            <!-- Volume Control (Vertical) -->
            <div class="volume-control-wrapper" @mouseenter.stop="showVolumeSlider = true" @mouseleave.stop="showVolumeSlider = false" role="group" aria-label="音量控制">
              <transition name="fade">
                <div class="volume-slider-container" v-show="showVolumeSlider">
                   <div class="volume-track">
                      <div class="volume-bar" :style="{ height: (volume * 100) + '%' }"></div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        v-model.number="volume"
                        class="volume-slider-vertical"
                        :aria-label="`音量 ${Math.round(volume * 100)}%`"
                        :aria-valuenow="Math.round(volume * 100)"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        @mousedown.stop
                      >
                   </div>
                </div>
              </transition>
              <button class="icon-btn" @click.stop="toggleMute" :title="volume > 0 ? '静音' : '取消静音'" :aria-label="volume > 0 ? '静音' : '取消静音'">
                <svg v-if="volume > 0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                <svg v-else aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              </button>
            </div>

            <!-- More Menu Button -->
            <div class="more-control-wrapper" ref="moreMenuRef">
              <button class="icon-btn" @click.stop="toggleMoreMenu" :class="{ active: showMoreMenu }" title="更多选项" aria-label="更多选项" :aria-expanded="showMoreMenu">
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              </button>

              <transition name="fade-slide-up">
                <div class="more-menu-popup" v-if="showMoreMenu" @mousedown.stop>
                   <div class="more-menu-item" @click.stop="toggleLyrics">
                      <span class="menu-icon text-icon">词</span>
                      <span class="menu-text">桌面歌词</span>
                      <div class="menu-toggle" :class="{ active: showLyrics }"></div>
                   </div>
                   <div class="more-menu-item" @click.stop="toggleShuffle">
                      <span class="menu-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
                      </span>
                      <span class="menu-text">随机播放</span>
                      <div class="menu-toggle" :class="{ active: shuffleMode }"></div>
                   </div>
                   <div class="more-menu-item" @click.stop="togglePlaylist">
                      <span class="menu-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                      </span>
                      <span class="menu-text">播放列表</span>
                   </div>
                </div>
              </transition>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div
          class="progress-container"
          @click.stop="seek"
          role="slider"
          :aria-label="`播放进度 ${Math.round(progress)}%`"
          :aria-valuenow="Math.round(progress)"
          aria-valuemin="0"
          aria-valuemax="100"
          tabindex="0"
        >
          <div class="progress-bg">
            <div class="progress-fill" :style="{ transform: `scaleX(${progress / 100})` }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Playlist Popup -->
    <transition name="fade-slide">
      <div class="playlist-panel" v-if="showPlaylist" @mousedown.stop>
        <div class="playlist-header">
          <span>Playlist ({{ playlist.length }})</span>
          <button class="icon-btn" @click.stop="showPlaylist = false">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <ul class="playlist-items">
          <li
            v-for="(song, index) in playlist"
            :key="song.id || index"
            :class="{ active: index === currentIndex }"
            @click.stop="playIndex(index)"
          >
            <div class="item-index" v-if="index === currentIndex">
               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
            <div class="item-index" v-else>{{ index + 1 }}</div>
            <div class="item-info">
              <div class="item-title">{{ song.name }}</div>
              <div class="item-artist">{{ song.artist }}</div>
            </div>
          </li>
        </ul>
      </div>
    </transition>

    <!-- Toast Notification (fix P13) -->
    <transition name="toast-fade">
      <div
        v-if="toastVisible"
        class="toast-notification"
        :class="[`toast-${toastType}`]"
      >
        {{ toastMessage }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

const audioRef = ref(null)
const isPlaying = ref(false)
const playlist = ref([])
const currentIndex = ref(0)
const progress = ref(0)
const showPlaylist = ref(false)
const showLyrics = ref(true)
const loopMode = ref('all')
const shuffleMode = ref(false)  // 新增：随机播放模式
const volume = ref(0.7)
const lastVolume = ref(0.7)
const showVolumeSlider = ref(false)
const showMoreMenu = ref(false)
const moreMenuRef = ref(null)

// Resize handler (component scope for cleanup)
let handleResize = null

// AbortController for cancelling pending requests (fix P4)
let lyricsAbortController = null

// ==================== Configuration Constants (fix P5, P9) ====================
const CONFIG = {
  API_BASE_URL: 'https://api.i-meto.com/meting/api',
  DEFAULT_PLAYLIST_ID: '7650673579',
  PLAYER_WIDTH: 320,
  PLAYER_HEIGHT: 70,
  LYRICS_WIDTH: 250,
  LYRICS_HEIGHT: 80,
  DEFAULT_MARGIN: 24,
  SEEK_STEP_SECONDS: 5,
  VOLUME_STEP: 0.1,
  UPDATE_THROTTLE_MS: 100,
  ERROR_RETRY_DELAY_MS: 1000
}

const ALLOWED_URL_PROTOCOLS = ['https:', 'data:']

// Throttle utility (for performance optimization)
const throttle = (func, limit) => {
  let inThrottle = null
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Binary search for lyrics (O(log n) instead of O(n))
const findLyricIndexByTime = (currentTime, lyricsArray) => {
  if (!lyricsArray || lyricsArray.length === 0) return -1

  let left = 0
  let right = lyricsArray.length - 1
  let result = -1

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    if (lyricsArray[mid].time <= currentTime) {
      result = mid
      left = mid + 1
    } else {
      right = mid - 1
    }
  }

  return result
}

// Lyrics state
const lyrics = ref([])
const currentLyric = ref('')
const nextLyric = ref('')
const lyricIndex = ref(-1)

// Position state
const playerPos = ref({ x: 24, y: window.innerHeight - 94 })
const lyricsPos = ref({ x: window.innerWidth / 2 - 125, y: 80 })

// Dragging state
const isPlayerDragging = ref(false)
const playerDragOffset = ref({ x: 0, y: 0 })
const isLyricsDragging = ref(false)
const lyricsDragOffset = ref({ x: 0, y: 0 })

// Settings
const contextMenuVisible = ref(false)
const contextMenuPos = ref({ x: 0, y: 0 })
const lyricsSettings = ref({
  fontSize: 24,
  color: '#ffffff'
})

// Toast notification system (fix P13)
const toastVisible = ref(false)
const toastMessage = ref('')
const toastType = ref('info') // 'info', 'error', 'success'
let toastTimer = null

const showToast = (message, type = 'info', duration = 3000) => {
  toastMessage.value = message
  toastType.value = type
  toastVisible.value = true

  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, duration)
}

// Computed styles with boundary constraints
const playerStyle = computed(() => ({
  left: `${playerPos.value.x}px`,
  top: `${playerPos.value.y}px`
}))

const lyricsStyle = computed(() => ({
  left: `${lyricsPos.value.x}px`,
  top: `${lyricsPos.value.y}px`
}))

const contextMenuStyle = computed(() => {
  let x = contextMenuPos.value.x
  let y = contextMenuPos.value.y

  // Boundary check for context menu
  const menuWidth = 220
  const menuHeight = 160
  if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10
  if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10

  return { left: `${x}px`, top: `${y}px` }
})

// Boundary constraint utility
const constrainToViewport = (pos, elementWidth, elementHeight, margin = 24) => {
  return {
    x: Math.max(margin, Math.min(pos.x, window.innerWidth - elementWidth - margin)),
    y: Math.max(margin, Math.min(pos.y, window.innerHeight - elementHeight - margin))
  }
}

// Initialize positions from localStorage or defaults
const initPositions = () => {
  // Player position
  try {
    const savedPlayer = localStorage.getItem('player-position')
    if (savedPlayer) {
      playerPos.value = constrainToViewport(JSON.parse(savedPlayer), CONFIG.PLAYER_WIDTH, CONFIG.PLAYER_HEIGHT)
    }
  } catch (e) {
    // Use default position
  }

  // Lyrics position
  try {
    const savedLyrics = localStorage.getItem('lyrics-position')
    if (savedLyrics) {
      lyricsPos.value = constrainToViewport(JSON.parse(savedLyrics), CONFIG.LYRICS_WIDTH, CONFIG.LYRICS_HEIGHT)
    }
  } catch (e) {
    // Set default based on screen size
    if (window.innerWidth < 768) {
      lyricsPos.value = { x: 20, y: window.innerHeight - 180 }
    } else {
      lyricsPos.value = { x: window.innerWidth - 350, y: 80 }
    }
  }

  // Lyrics settings
  try {
    const savedSettings = localStorage.getItem('lyrics-settings')
    if (savedSettings) {
      lyricsSettings.value = JSON.parse(savedSettings)
    }
  } catch (e) {
    // Use default settings
  }

  // Lyrics visibility
  const savedVisible = localStorage.getItem('lyrics-visible')
  if (savedVisible !== null) {
    showLyrics.value = savedVisible === 'true'
  }
}

// Player drag handlers
const startPlayerDrag = (e) => {
  // Prevent drag on controls
  if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.progress-container')) return

  // Prevent duplicate listeners (fix P3)
  stopPlayerDrag()

  isPlayerDragging.value = true
  const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX
  const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY

  playerDragOffset.value = {
    x: clientX - playerPos.value.x,
    y: clientY - playerPos.value.y
  }

  window.addEventListener('mousemove', onPlayerDrag)
  window.addEventListener('mouseup', stopPlayerDrag)
  window.addEventListener('touchmove', onPlayerDrag, { passive: false })
  window.addEventListener('touchend', stopPlayerDrag)
}

const onPlayerDrag = (e) => {
  if (!isPlayerDragging.value) return
  if (e.type === 'touchmove') e.preventDefault()

  const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX
  const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY

  const newPos = {
    x: clientX - playerDragOffset.value.x,
    y: clientY - playerDragOffset.value.y
  }

  playerPos.value = constrainToViewport(newPos, CONFIG.PLAYER_WIDTH, CONFIG.PLAYER_HEIGHT)
}

const stopPlayerDrag = () => {
  isPlayerDragging.value = false
  window.removeEventListener('mousemove', onPlayerDrag)
  window.removeEventListener('mouseup', stopPlayerDrag)
  window.removeEventListener('touchmove', onPlayerDrag)
  window.removeEventListener('touchend', stopPlayerDrag)

  localStorage.setItem('player-position', JSON.stringify(playerPos.value))
}

// Lyrics drag handlers
const startLyricsDrag = (e) => {
  // Prevent duplicate listeners (fix P3)
  stopLyricsDrag()

  isLyricsDragging.value = true
  const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX
  const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY

  lyricsDragOffset.value = {
    x: clientX - lyricsPos.value.x,
    y: clientY - lyricsPos.value.y
  }

  window.addEventListener('mousemove', onLyricsDrag)
  window.addEventListener('mouseup', stopLyricsDrag)
  window.addEventListener('touchmove', onLyricsDrag, { passive: false })
  window.addEventListener('touchend', stopLyricsDrag)
}

const onLyricsDrag = (e) => {
  if (!isLyricsDragging.value) return
  if (e.type === 'touchmove') e.preventDefault()

  const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX
  const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY

  const newPos = {
    x: clientX - lyricsDragOffset.value.x,
    y: clientY - lyricsDragOffset.value.y
  }

  lyricsPos.value = constrainToViewport(newPos, CONFIG.LYRICS_WIDTH, CONFIG.LYRICS_HEIGHT)
}

const stopLyricsDrag = () => {
  isLyricsDragging.value = false
  window.removeEventListener('mousemove', onLyricsDrag)
  window.removeEventListener('mouseup', stopLyricsDrag)
  window.removeEventListener('touchmove', onLyricsDrag)
  window.removeEventListener('touchend', stopLyricsDrag)

  localStorage.setItem('lyrics-position', JSON.stringify(lyricsPos.value))
}

// Song management
const currentSong = computed(() => {
  return playlist.value[currentIndex.value] || null
})

const fetchPlaylist = async () => {
  try {
    const url = `${CONFIG.API_BASE_URL}?server=netease&type=playlist&id=${CONFIG.DEFAULT_PLAYLIST_ID}`
    const res = await fetch(url)
    const data = await res.json()
    if (Array.isArray(data)) {
      playlist.value = data.map(item => ({
        name: item.title,
        artist: item.author,
        url: sanitizeUrl(item.url), // URL validation (fix P10)
        cover: sanitizeUrl(item.pic),
        lrc: sanitizeUrl(item.lrc)
      }))
    }
  } catch (err) {
    console.error('Failed to fetch playlist:', err)
    showToast('获取播放列表失败，请检查网络连接', 'error')
  }
}

// URL sanitization utility (fix P10)
const sanitizeUrl = (url) => {
  if (!url) return ''
  try {
    const parsed = new URL(url, location.href)
    if (!ALLOWED_URL_PROTOCOLS.includes(parsed.protocol)) {
      console.warn('Blocked insecure URL:', url)
      return ''
    }
    return url
  } catch (e) {
    console.warn('Invalid URL:', url)
    return ''
  }
}

// LRC parsing
const parseLRC = (lrcContent) => {
  if (!lrcContent) return []
  const lines = lrcContent.split('\n')
  const result = []
  const timeExp = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/

  for (const line of lines) {
    const match = timeExp.exec(line)
    if (match) {
      const min = parseInt(match[1])
      const sec = parseInt(match[2])
      const msStr = match[3] || '0'
      const ms = msStr.length === 2 ? parseInt(msStr) * 10 : parseInt(msStr)
      const time = min * 60 + sec + ms / 1000
      const text = line.replace(timeExp, '').trim()
      if (text) {
        result.push({ time, text })
      }
    }
  }
  return result.sort((a, b) => a.time - b.time)
}

const fetchLyrics = async (url) => {
  // Cancel previous request if exists (fix P4)
  if (lyricsAbortController) {
    lyricsAbortController.abort()
  }

  lyrics.value = []
  currentLyric.value = ''
  nextLyric.value = ''
  lyricIndex.value = -1

  if (!url) return

  // Create new AbortController for this request
  lyricsAbortController = new AbortController()

  try {
    const res = await fetch(url, { signal: lyricsAbortController.signal })
    const text = await res.text()
    lyrics.value = parseLRC(text)
  } catch (err) {
    // Ignore abort errors (user switched songs)
    if (err.name !== 'AbortError') {
      console.error('Failed to fetch lyrics:', err)
      showToast('获取歌词失败', 'error')
    }
  } finally {
    lyricsAbortController = null
  }
}

watch(currentSong, (newSong) => {
  if (newSong?.lrc) {
    fetchLyrics(newSong.lrc)
  } else {
    lyrics.value = []
    currentLyric.value = ''
    nextLyric.value = ''
    lyricIndex.value = -1
  }
}, { immediate: true })

// Playback controls
const togglePlay = () => {
  if (!audioRef.value || !currentSong.value) return

  if (isPlaying.value) {
    audioRef.value.pause()
  } else {
    audioRef.value.play().catch(e => console.error('Play error:', e))
  }
  isPlaying.value = !isPlaying.value
}

const playIndex = async (index) => {
  if (index < 0 || index >= playlist.value.length) return
  currentIndex.value = index
  isPlaying.value = true

  // Use nextTick instead of setTimeout for reliable DOM update timing
  await nextTick()
  if (audioRef.value) {
    audioRef.value.play().catch(e => console.error('Play error:', e))
  }
}

const next = () => {
  if (playlist.value.length === 0) return

  let nextIndex
  if (shuffleMode.value) {
    // Shuffle mode: pick random index different from current
    do {
      nextIndex = Math.floor(Math.random() * playlist.value.length)
    } while (nextIndex === currentIndex.value && playlist.value.length > 1)
  } else {
    // Normal mode: next song (loop to beginning if at end)
    nextIndex = currentIndex.value + 1
    if (nextIndex >= playlist.value.length) {
      nextIndex = 0
    }
  }
  playIndex(nextIndex)
}

const prev = () => {
  if (playlist.value.length === 0) return

  let prevIndex
  if (shuffleMode.value) {
    // Shuffle mode: pick random previous song
    do {
      prevIndex = Math.floor(Math.random() * playlist.value.length)
    } while (prevIndex === currentIndex.value && playlist.value.length > 1)
  } else {
    // Normal mode: previous song (loop to end if at beginning)
    prevIndex = currentIndex.value - 1
    if (prevIndex < 0) {
      prevIndex = playlist.value.length - 1
    }
  }
  playIndex(prevIndex)
}

// Toggle shuffle mode
const toggleShuffle = () => {
  shuffleMode.value = !shuffleMode.value
}

// Audio event handlers
const onEnded = () => {
  if (!audioRef.value) return
  if (loopMode.value === 'one') {
    audioRef.value.currentTime = 0
    audioRef.value.play().catch(e => console.error('Replay error:', e))
  } else {
    next()
  }
}

const onTimeUpdate = throttle(() => {
  if (!audioRef.value) return
  const { currentTime, duration } = audioRef.value
  if (duration) {
    progress.value = (currentTime / duration) * 100
  }

  // Update Lyrics (using binary search for O(log n) performance)
  if (lyrics.value.length > 0) {
    const activeIndex = findLyricIndexByTime(currentTime, lyrics.value)

    if (activeIndex !== lyricIndex.value) {
      lyricIndex.value = activeIndex
      if (activeIndex !== -1) {
        currentLyric.value = lyrics.value[activeIndex].text
        if (activeIndex + 1 < lyrics.value.length) {
          nextLyric.value = lyrics.value[activeIndex + 1].text
        } else {
          nextLyric.value = ''
        }
      } else {
        currentLyric.value = ''
        nextLyric.value = ''
      }
    }
  }
}, 100) // Throttle to ~10fps for better performance

const seek = (e) => {
  if (!audioRef.value || !currentSong.value) return
  const rect = e.currentTarget.getBoundingClientRect()
  const x = e.clientX - rect.left
  const width = rect.width
  const percent = Math.min(Math.max(x / width, 0), 1)

  const duration = audioRef.value.duration
  if (duration) {
    audioRef.value.currentTime = duration * percent
    progress.value = percent * 100
  }
}

const onCanPlay = () => {
  if (isPlaying.value && audioRef.value) {
    const playPromise = audioRef.value.play()
    if (playPromise !== undefined) {
      playPromise.catch(e => {
        console.warn('Auto-play prevented by browser, waiting for user interaction')
      })
    }
  }
}

const onError = () => {
  console.error("Audio error")
  showToast('音频播放出错，正在尝试下一首...', 'error')
  if (isPlaying.value) {
    setTimeout(next, CONFIG.ERROR_RETRY_DELAY_MS)
  }
}

// UI controls
const togglePlaylist = () => {
  showPlaylist.value = !showPlaylist.value
}

const toggleLyrics = () => {
  showLyrics.value = !showLyrics.value
  localStorage.setItem('lyrics-visible', showLyrics.value)
}

const toggleMute = () => {
  if (volume.value > 0) {
    lastVolume.value = volume.value
    volume.value = 0
  } else {
    volume.value = lastVolume.value || 0.7
  }
}

const toggleMoreMenu = () => {
  showMoreMenu.value = !showMoreMenu.value
}

const handleContextMenu = (e) => {
  contextMenuVisible.value = true
  contextMenuPos.value = {
    x: e.clientX || (e.touches && e.touches[0]?.clientX) || 0,
    y: e.clientY || (e.touches && e.touches[0]?.clientY) || 0
  }
}

const handleClickOutside = (e) => {
  if (contextMenuVisible.value) {
     const menu = document.querySelector('.context-menu')
     if (menu && !menu.contains(e.target)) {
        contextMenuVisible.value = false
     }
  }

  if (showMoreMenu.value && moreMenuRef.value && !moreMenuRef.value.contains(e.target)) {
     showMoreMenu.value = false
  }
}

// Keyboard shortcuts handler (fix P6)
const handleKeydown = (e) => {
  // Ignore if user is typing in an input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

  switch (e.code) {
    case 'Space':
      e.preventDefault()
      togglePlay()
      break
    case 'ArrowLeft':
      e.preventDefault()
      if (audioRef.value) {
        audioRef.value.currentTime = Math.max(0, audioRef.value.currentTime - 5)
      }
      break
    case 'ArrowRight':
      e.preventDefault()
      if (audioRef.value) {
        audioRef.value.currentTime = Math.min(audioRef.value.duration || 0, audioRef.value.currentTime + 5)
      }
      break
    case 'ArrowUp':
      e.preventDefault()
      volume.value = Math.min(1, volume.value + 0.1)
      break
    case 'ArrowDown':
      e.preventDefault()
      volume.value = Math.max(0, volume.value - 0.1)
      break
    case 'KeyM':
      toggleMute()
      break
    case 'KeyL':
      toggleLyrics()
      break
    case 'KeyS':
      toggleShuffle()
      break
  }
}

watch(volume, (newVal) => {
  if (audioRef.value) {
    audioRef.value.volume = newVal
  }
})

watch(lyricsSettings, (newSettings) => {
  localStorage.setItem('lyrics-settings', JSON.stringify(newSettings))
}, { deep: true })

onMounted(() => {
  initPositions()
  fetchPlaylist()
  if (audioRef.value) {
    audioRef.value.volume = volume.value
  }
  window.addEventListener('click', handleClickOutside)
  window.addEventListener('keydown', handleKeydown) // Add keyboard shortcuts (fix P6)

  // Handle window resize to keep elements in viewport
  handleResize = () => {
    playerPos.value = constrainToViewport(playerPos.value, CONFIG.PLAYER_WIDTH, CONFIG.PLAYER_HEIGHT)
    lyricsPos.value = constrainToViewport(lyricsPos.value, CONFIG.LYRICS_WIDTH, CONFIG.LYRICS_HEIGHT)
  }

  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  // Cleanup drag event listeners
  window.removeEventListener('mousemove', onPlayerDrag)
  window.removeEventListener('mouseup', stopPlayerDrag)
  window.removeEventListener('touchmove', onPlayerDrag)
  window.removeEventListener('touchend', stopPlayerDrag)
  window.removeEventListener('mousemove', onLyricsDrag)
  window.removeEventListener('mouseup', stopLyricsDrag)
  window.removeEventListener('touchmove', onLyricsDrag)
  window.removeEventListener('touchend', stopLyricsDrag)

  // Cleanup other listeners
  window.removeEventListener('click', handleClickOutside)
  window.removeEventListener('keydown', handleKeydown) // Cleanup keyboard shortcuts (fix P6)

  // Cleanup resize listener (fix memory leak M1)
  if (handleResize) {
    window.removeEventListener('resize', handleResize)
    handleResize = null
  }

  // Cancel any pending lyrics fetch requests
  if (lyricsAbortController) {
    lyricsAbortController.abort()
    lyricsAbortController = null
  }
})
</script>

<style scoped>
.music-player-wrapper {
  position: fixed;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* Lyrics Display */
.lyrics-container {
  position: fixed;
  z-index: 9998;
  text-align: center;
  pointer-events: auto;

  /* Dynamic size constraints */
  max-width: min(600px, calc(100vw - 48px));
  width: fit-content;
  padding: 12px 24px;

  /* Height constraint with safe bottom margin */
  max-height: calc(100vh - 96px);
  overflow: hidden;

  /* Glassmorphism with fallback (fix P11) */
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-radius: 20px;

  cursor: grab;
  user-select: none;
  touch-action: none;
  transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
}

/* Enhanced glass effect for modern browsers */
@supports (backdrop-filter: blur(12px)) {
  .lyrics-container {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-color: rgba(255, 255, 255, 0.2);
  }
}

.lyrics-container:active {
  cursor: grabbing;
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

[data-theme="dark"] .lyrics-container {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

[data-theme="dark"] .lyrics-container:active {
  background: rgba(0, 0, 0, 0.6);
}

@media screen and (max-width: 768px) {
  .lyrics-container {
    padding: 8px 16px;
  }

  .lyric-line.current {
    font-size: 16px;
    text-shadow: 0 1px 4px rgba(0,0,0,0.8);
  }
  .lyric-line.next {
    font-size: 12px;
  }
}

.lyrics-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.lyric-line {
  display: block;
  font-weight: 600;
  color: var(--text-primary, #333);
  text-shadow: 0 2px 10px rgba(255, 255, 255, 0.8);
  opacity: 0.9;
  line-height: 1.2;
  transition: all 0.3s ease;
}

.lyric-line.next {
  opacity: 0.6;
  font-weight: 500;
}

.lyrics-placeholder {
  font-size: 14px;
  opacity: 0.8;
  font-weight: 500;
}

[data-theme="dark"] .lyric-line {
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

/* Lyric Transition */
.lyric-fade-enter-active,
.lyric-fade-leave-active {
  transition: all 0.3s ease;
}

.lyric-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.lyric-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Widget Container */
.player-widget {
  display: flex;
  align-items: center;
  background: var(--bg-secondary, rgba(255, 255, 255, 0.95));
  border: 1px solid var(--border-color, rgba(200, 200, 200, 0.3));
  border-radius: 999px;
  padding: 8px 12px 8px 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-width: 480px;
  width: fit-content;
}

/* Enhanced glass effect for modern browsers */
@supports (backdrop-filter: blur(12px)) {
  .player-widget {
    background: var(--bg-secondary, #fff);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-color: var(--border-color, #eee);
  }
}

[data-theme="dark"] .player-widget {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  background: rgba(40, 40, 40, 0.85);
  border-color: rgba(255, 255, 255, 0.1);
}

/* Cover Art */
.cover-container {
  position: relative;
  cursor: pointer;
  margin-right: 12px;
  flex-shrink: 0;
}

.cover-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--border-light, #f5f5f5);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--bg-primary, #fff);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s linear;
}

.cover-img.rotating {
  animation: rotate 10s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cover-placeholder {
  color: var(--text-tertiary, #999);
}

/* Content Area */
.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.song-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-right: 12px;
}

.song-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.song-artist {
  font-size: 11px;
  color: var(--text-secondary, #666);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

/* Controls */
.controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-control-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.volume-slider-container {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding-bottom: 10px;
  z-index: 100;
}

.volume-track {
  background: var(--bg-secondary, #fff);
  padding: 0;
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  border: 1px solid var(--border-color, #eee);
  display: flex;
  justify-content: center;
  align-items: center;
  height: 120px;
  width: 36px;
  position: relative;
  overflow: hidden;
}

[data-theme="dark"] .volume-track {
  background: rgba(40, 40, 40, 0.95);
  border-color: rgba(255, 255, 255, 0.1);
}

/* Vertical Slider using Transform */
.volume-slider-vertical {
  width: 100px;
  height: 36px;
  transform: rotate(-90deg);
  background: transparent;
  cursor: pointer;
  appearance: none;
  outline: none;
}

.volume-bar {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  background: var(--text-primary, #333);
  border-radius: 2px;
  pointer-events: none;
  z-index: 1;
}

/* Track background line */
.volume-track::before {
  content: '';
  position: absolute;
  top: 10px;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  background: rgba(128, 128, 128, 0.2);
  border-radius: 2px;
}

/* Slider Thumb Styling */
.volume-slider-vertical::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: var(--text-primary, #333);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  margin-top: 12px;
  position: relative;
  z-index: 2;
}

.volume-slider-vertical::-webkit-slider-runnable-track {
  width: 100%;
  height: 36px;
  background: transparent;
  border: none;
}

/* More Menu Styles */
.more-control-wrapper {
  position: relative;
}

.more-menu-popup {
  position: absolute;
  bottom: 140%;
  right: 0;
  width: 180px;
  background: var(--bg-secondary, #fff);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-color, #eee);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  padding: 6px;
  z-index: 100;
  overflow: hidden;
}

[data-theme="dark"] .more-menu-popup {
  background: rgba(40, 40, 40, 0.95);
  border-color: rgba(255, 255, 255, 0.1);
}

.more-menu-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary, #333);
}

.more-menu-item:hover {
  background: rgba(128, 128, 128, 0.1);
}

.menu-icon {
  margin-right: 10px;
  display: flex;
  align-items: center;
  color: var(--text-secondary, #666);
}

.menu-text {
  font-size: 13px;
  font-weight: 500;
  flex: 1;
}

/* Toggle Switch Style */
.menu-toggle {
  width: 32px;
  height: 18px;
  background: rgba(128, 128, 128, 0.2);
  border-radius: 999px;
  position: relative;
  transition: all 0.3s;
}

.menu-toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: all 0.3s;
}

.menu-toggle.active {
  background: var(--text-primary, #333);
}

.menu-toggle.active::after {
  transform: translateX(14px);
}

[data-theme="dark"] .menu-toggle.active {
  background: #fff;
}

[data-theme="dark"] .menu-toggle.active::after {
  background: #000;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary, #666);
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  width: 32px;
  height: 32px;
}

.icon-btn svg {
  width: 18px;
  height: 18px;
}

.icon-btn:hover {
  background: rgba(128, 128, 128, 0.1);
  color: var(--text-primary, #000);
}

.icon-btn.active {
  color: var(--link-color, #000);
  background: rgba(128, 128, 128, 0.15);
}

/* Progress Bar */
.progress-container {
  height: 4px;
  width: 100%;
  cursor: pointer;
  padding: 2px 0;
}

.progress-bg {
  height: 3px;
  background: var(--border-color, #eee);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--link-color, #000);
  border-radius: 2px;
  /* Use transform for GPU-accelerated rendering (fix P12) */
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.1s linear;
}

/* Playlist Panel */
.playlist-panel {
  position: absolute;
  bottom: 60px;
  left: 0;
  width: 280px;
  max-height: 400px;
  background: var(--bg-secondary, #fff);
  border: 1px solid var(--border-color, #eee);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

[data-theme="dark"] .playlist-panel {
  background: rgba(35, 35, 35, 0.95);
  backdrop-filter: blur(10px);
  border-color: rgba(255, 255, 255, 0.1);
}

.playlist-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light, #f5f5f5);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.playlist-items {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex: 1;
}

.playlist-items::-webkit-scrollbar {
  width: 4px;
}

.playlist-items::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}

.playlist-items li {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid transparent;
}

.playlist-items li:hover {
  background: rgba(128, 128, 128, 0.05);
}

.playlist-items li.active {
  background: rgba(128, 128, 128, 0.1);
}

.item-index {
  width: 24px;
  font-size: 12px;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
}

.active .item-index {
  color: var(--link-color);
}

.item-info {
  flex: 1;
  overflow: hidden;
}

.item-title {
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-artist {
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
/* Context Menu */
.context-menu {
  position: fixed;
  z-index: 10000;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  padding: 12px;
  min-width: 200px;
  color: #333;
  transform-origin: top left;
}

[data-theme="dark"] .context-menu {
  background: rgba(30, 30, 30, 0.9);
  border-color: rgba(255, 255, 255, 0.1);
  color: #fff;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.menu-header {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: #999;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] .menu-header {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.menu-item:last-child {
  margin-bottom: 0;
}

.menu-item label {
  font-size: 13px;
  font-weight: 500;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.value {
  font-size: 12px;
  color: #666;
  width: 32px;
  text-align: right;
}

[data-theme="dark"] .value {
  color: #aaa;
}

/* Range Input */
input[type="range"] {
  width: 80px;
  height: 4px;
  background: #ddd;
  border-radius: 2px;
  appearance: none;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  background: var(--link-color, #333);
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.1s;
  margin-top: -4px;
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

/* Color Input */
input[type="color"] {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  background: none;
}

input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

input[type="color"]::-webkit-color-swatch {
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 50%;
}

/* Toast Notification (fix P13) */
.toast-notification {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  z-index: 10001;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  white-space: nowrap;
}

.toast-info {
  background: rgba(59, 130, 246, 0.95);
  color: #fff;
}

.toast-error {
  background: rgba(239, 68, 68, 0.95);
  color: #fff;
}

.toast-success {
  background: rgba(34, 197, 94, 0.95);
  color: #fff;
}

/* Toast Animation */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
