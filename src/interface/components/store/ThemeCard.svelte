<script lang="ts">
  import type { Theme } from '@/interface/types/Theme'

  let { theme, onClick } = $props<{ theme: Theme; onClick: () => void }>();

  import { fade } from 'svelte/transition';
</script>

<div class="w-full cursor-pointer" role="button" tabindex="-1" onkeydown={onClick} onclick={onClick}>
  <div class="bg-gray-50 w-full transition-all hover:scale-105 duration-500 relative group flex flex-col hover:shadow-2xl dark:hover:shadow-white/[0.1] hover:shadow-white/[0.8] dark:bg-zinc-800 dark:border-white/[0.1] h-auto rounded-xl overflow-clip border" transition:fade>
    <div class="absolute bottom-1 left-3 z-10 mb-1 text-xl font-bold text-white">
      {theme.name}
    </div>
    <div class='absolute bottom-0 z-0 w-full h-3/4 bg-gradient-to-t to-transparent from-black/80'></div>
    <div class='w-full'>
      <img src={theme.marqueeImage} alt="Theme Preview" class="object-cover w-full h-48 rounded-md" />
    </div>
  </div>
</div>
