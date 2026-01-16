import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

export default {
  template: `
  <div class="music-player-wrapper">
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
      :style="{ top: lyricsPos.y + 'px', left: lyricsPos.x + 'px' }"
      @mousedown="startDrag"
      @touchstart="startDrag"
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
        :style="{ top: contextMenuPos.y + 'px', left: contextMenuPos.x + 'px' }"
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

    <div class="player-widget" :class="{ 'is-playing': isPlaying }">
      <!-- Album Art & Play Toggle -->
      <div class="cover-container" @click="togglePlay">
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
            <button class="icon-btn" @click="prev" title="Previous">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
            </button>
            <button class="icon-btn" @click="togglePlay" title="Play/Pause">
               <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
               <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            </button>
            <button class="icon-btn" @click="next" title="Next">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
            </button>
            
            <!-- Volume Control (Vertical) -->
            <div class="volume-control-wrapper" @mouseenter="showVolumeSlider = true" @mouseleave="showVolumeSlider = false">
              <transition name="fade">
                <div class="volume-slider-container" v-show="showVolumeSlider">
                   <div class="volume-track">
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        v-model.number="volume"
                        class="volume-slider-vertical"
                        title="Volume"
                        :style="{ background: \`linear-gradient(to right, var(--text-primary, #333) \${volume * 100}%, rgba(128, 128, 128, 0.2) \${volume * 100}%)\` }"
                      >
                   </div>
                </div>
              </transition>
              <button class="icon-btn" @click="toggleMute" title="Mute/Unmute">
                <svg v-if="volume > 0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              </button>
            </div>

            <!-- More Menu Button -->
            <div class="more-control-wrapper" ref="moreMenuRef">
              <button class="icon-btn" @click="toggleMoreMenu" :class="{ active: showMoreMenu }" title="More">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              </button>
              
              <transition name="fade-slide-up">
                <div class="more-menu-popup" v-if="showMoreMenu">
                   <div class="more-menu-item" @click="toggleLyrics">
                      <span class="menu-icon text-icon">词</span>
                      <span class="menu-text">桌面歌词</span>
                      <div class="menu-toggle" :class="{ active: showLyrics }"></div>
                   </div>
                   <div class="more-menu-item" @click="togglePlaylist">
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
        <div class="progress-container" @click="seek">
          <div class="progress-bg">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Playlist Popup -->
    <transition name="fade-slide">
      <div class="playlist-panel" v-if="showPlaylist">
        <div class="playlist-header">
          <span>Playlist ({{ playlist.length }})</span>
          <button class="icon-btn" @click="showPlaylist = false">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <ul class="playlist-items">
          <li 
            v-for="(song, index) in playlist" 
            :key="song.id || index"
            :class="{ active: index === currentIndex }"
            @click="playIndex(index)"
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
  </div>
  `,
  setup() {
    const audioRef = ref(null)
    const isPlaying = ref(false)
    const playlist = ref([])
    const currentIndex = ref(0)
    const progress = ref(0)
    const showPlaylist = ref(false)
    const showLyrics = ref(true)
    const loopMode = ref('all') // 'all', 'one', 'none'
    const volume = ref(0.7)
    const lastVolume = ref(0.7)
    const showVolumeSlider = ref(false)
    const showMoreMenu = ref(false)
    const moreMenuRef = ref(null)

    // Lyrics state
    const lyrics = ref([])
    const currentLyric = ref('')
    const nextLyric = ref('')
    const lyricIndex = ref(-1)

    // Draggable Lyrics Logic
    const lyricsPos = ref({ x: 0, y: 0 })
    const isDragging = ref(false)
    const dragOffset = ref({ x: 0, y: 0 })

    const initLyricsPosition = () => {
      const saved = localStorage.getItem('lyrics-position')
      if (saved) {
        try {
          lyricsPos.value = JSON.parse(saved)
          // Ensure it's within viewport (simple check)
          if (lyricsPos.value.x > window.innerWidth) lyricsPos.value.x = window.innerWidth - 200
          if (lyricsPos.value.y > window.innerHeight) lyricsPos.value.y = window.innerHeight - 100
        } catch (e) {
          console.error(e)
        }
      } else {
        // Initial position based on screen size
        if (window.innerWidth < 768) {
          lyricsPos.value = { x: 20, y: window.innerHeight - 200 }
        } else {
          lyricsPos.value = { x: window.innerWidth - 400, y: 80 }
        }
      }
    }

    const startDrag = (e) => {
      isDragging.value = true
      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX
      const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY
      
      dragOffset.value = {
        x: clientX - lyricsPos.value.x,
        y: clientY - lyricsPos.value.y
      }
      
      window.addEventListener('mousemove', onDrag)
      window.addEventListener('mouseup', stopDrag)
      window.addEventListener('touchmove', onDrag, { passive: false })
      window.addEventListener('touchend', stopDrag)
    }

    const onDrag = (e) => {
      if (!isDragging.value) return
      if (e.type === 'touchmove') {
         e.preventDefault() 
      }
      
      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX
      const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY
      
      lyricsPos.value = {
        x: clientX - dragOffset.value.x,
        y: clientY - dragOffset.value.y
      }
    }

    const stopDrag = () => {
      isDragging.value = false
      window.removeEventListener('mousemove', onDrag)
      window.removeEventListener('mouseup', stopDrag)
      window.removeEventListener('touchmove', onDrag)
      window.removeEventListener('touchend', stopDrag)
      
      localStorage.setItem('lyrics-position', JSON.stringify(lyricsPos.value))
    }

    const currentSong = computed(() => {
      return playlist.value[currentIndex.value] || null
    })

    // Fetch playlist from Meting API (mimicking the original behavior)
    const fetchPlaylist = async () => {
      try {
        const res = await fetch('https://api.i-meto.com/meting/api?server=netease&type=playlist&id=2902611397')
        const data = await res.json()
        if (Array.isArray(data)) {
          playlist.value = data.map(item => ({
            name: item.title,
            artist: item.author,
            url: item.url,
            cover: item.pic,
            lrc: item.lrc
          }))
        }
      } catch (err) {
        console.error('Failed to fetch playlist:', err)
      }
    }

    // Parse LRC content
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
          // .xx is 10ms, .xxx is 1ms
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

    // Fetch lyrics from URL
    const fetchLyrics = async (url) => {
      lyrics.value = []
      currentLyric.value = ''
      nextLyric.value = ''
      lyricIndex.value = -1
      
      if (!url) return

      try {
        const res = await fetch(url)
        const text = await res.text()
        lyrics.value = parseLRC(text)
      } catch (err) {
        console.error('Failed to fetch lyrics:', err)
      }
    }

    // Watch current song to fetch lyrics
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

    const togglePlay = () => {
      if (!audioRef.value || !currentSong.value) return
      
      if (isPlaying.value) {
        audioRef.value.pause()
      } else {
        audioRef.value.play().catch(e => console.error('Play error:', e))
      }
      isPlaying.value = !isPlaying.value
    }

    const playIndex = (index) => {
      if (index < 0 || index >= playlist.value.length) return
      currentIndex.value = index
      isPlaying.value = true
      // Wait for DOM update
      setTimeout(() => {
        if (audioRef.value) {
            audioRef.value.play().catch(e => console.error(e))
        }
      }, 50)
    }

    const next = () => {
      let nextIndex = currentIndex.value + 1
      if (nextIndex >= playlist.value.length) {
        nextIndex = 0 // Loop all
      }
      playIndex(nextIndex)
    }

    const prev = () => {
      let prevIndex = currentIndex.value - 1
      if (prevIndex < 0) {
        prevIndex = playlist.value.length - 1
      }
      playIndex(prevIndex)
    }

    const onEnded = () => {
      if (loopMode.value === 'one') {
        audioRef.value.currentTime = 0
        audioRef.value.play()
      } else {
        next()
      }
    }

    const onTimeUpdate = () => {
      if (!audioRef.value) return
      const { currentTime, duration } = audioRef.value
      if (duration) {
        progress.value = (currentTime / duration) * 100
      }

      // Update Lyrics
      if (lyrics.value.length > 0) {
        let activeIndex = -1
        for (let i = 0; i < lyrics.value.length; i++) {
          if (currentTime >= lyrics.value[i].time) {
            activeIndex = i
          } else {
            break
          }
        }
        
        if (activeIndex !== lyricIndex.value) {
          lyricIndex.value = activeIndex
          if (activeIndex !== -1) {
            currentLyric.value = lyrics.value[activeIndex].text
            // Set next lyric
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
    }

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
        audioRef.value.play().catch(e => {})
      }
    }

    const onError = (e) => {
        console.error("Audio error", e);
        // Auto skip on error
        if (isPlaying.value) {
            setTimeout(next, 1000);
        }
    }

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

    watch(volume, (newVal) => {
      if (audioRef.value) {
        audioRef.value.volume = newVal
      }
    })

    // --- Context Menu & Settings ---
    const contextMenuVisible = ref(false)
    const contextMenuPos = ref({ x: 0, y: 0 })
    const lyricsSettings = ref({
      fontSize: 24,
      color: '#ffffff'
    })

    const initLyricsSettings = () => {
      const saved = localStorage.getItem('lyrics-settings')
      if (saved) {
        try {
          lyricsSettings.value = JSON.parse(saved)
        } catch (e) {
          console.error(e)
        }
      }
    }

    watch(lyricsSettings, (newSettings) => {
      localStorage.setItem('lyrics-settings', JSON.stringify(newSettings))
    }, { deep: true })

    const handleContextMenu = (e) => {
      contextMenuVisible.value = true
      // Adjust position
      let x = e.clientX
      let y = e.clientY
      
      // Boundary check
      if (x + 220 > window.innerWidth) x = window.innerWidth - 230
      if (y + 160 > window.innerHeight) y = window.innerHeight - 170
      
      contextMenuPos.value = { x, y }
    }

    const toggleMoreMenu = () => {
      showMoreMenu.value = !showMoreMenu.value
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

    onMounted(() => {
      initLyricsPosition()
      initLyricsSettings()
      
      const savedLyricsVisible = localStorage.getItem('lyrics-visible')
      if (savedLyricsVisible !== null) {
        showLyrics.value = savedLyricsVisible === 'true'
      }

      fetchPlaylist()
      if (audioRef.value) {
        audioRef.value.volume = volume.value
      }
      window.addEventListener('click', handleClickOutside)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('mousemove', onDrag)
      window.removeEventListener('mouseup', stopDrag)
      window.removeEventListener('touchmove', onDrag)
      window.removeEventListener('touchend', stopDrag)
      window.removeEventListener('click', handleClickOutside)
    })

    return {
      audioRef, isPlaying, playlist, currentIndex, progress, showPlaylist, showLyrics, loopMode, volume, showVolumeSlider, showMoreMenu, moreMenuRef,
      lyrics, currentLyric, nextLyric, lyricIndex,
      lyricsPos, startDrag,
      currentSong,
      togglePlay, playIndex, next, prev, onEnded, onTimeUpdate, seek, onCanPlay, onError, togglePlaylist, toggleLyrics, toggleMute,
      contextMenuVisible, contextMenuPos, lyricsSettings, handleContextMenu, toggleMoreMenu
    }
  }
}
