import React, { useEffect, useState, useCallback, forwardRef, useImperativeHandle, ForwardRefExoticComponent, RefAttributes } from 'react';
import { listThemes, deleteTheme, setTheme, disableTheme, getDownloadedThemes } from '../hooks/ThemeManagment';
import { ThemeCover } from './ThemeCover';
import browser from 'webextension-polyfill';
import { CustomTheme, DownloadedTheme } from '../types/CustomThemes';
import { useSettingsContext } from '../SettingsContext';
import { SettingsState } from '../types/AppProps';
import { debounce } from 'lodash';

interface ThemeSelectorProps {
  isEditMode: boolean;
  ref: React.Ref<any>;
}

const ThemeSelector: ForwardRefExoticComponent<Omit<ThemeSelectorProps, "ref"> & RefAttributes<any>> = forwardRef(({ isEditMode = false }, ref) => {
  const [themes, setThemes] = useState<Omit<CustomTheme, 'CustomImages'>[]>([]);
  const [downloadedThemes, setDownloadedThemes] = useState<DownloadedTheme[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { settingsState, setSettingsState } = useSettingsContext();

  const setSelectedTheme = (themeId: string) => {
    setSettingsState((prevState: SettingsState) => ({
      ...prevState,
      selectedTheme: themeId,
    }));
  }

  useImperativeHandle(ref, () => ({
    disableTheme: async () => {
      await disableTheme();
      setSelectedTheme('');
    }
  }));

  useEffect(() => {
    const handleThemeChange = async () => {
      //await new Promise((resolve) => setTimeout(resolve, 500));
      fetchThemes();
    };

    window.addEventListener('message', (message) => {
      if (message.data.type === 'themeChanged') {
        handleThemeChange();
      }
    });

    return () => {
      window.removeEventListener('message', (message) => {
        if (message.data.type === 'themeChanged') {
          handleThemeChange();
        }
      });
    };
  }, []);

  const fetchThemes = async () => {
    try {
      const { themes, selectedTheme } = await listThemes();

      setThemes(themes);
      setDownloadedThemes(await getDownloadedThemes());
      setSelectedTheme(selectedTheme ? selectedTheme : '');

      const matchingThemes = themes.filter(theme => downloadedThemes.some((downloadedTheme: DownloadedTheme) => downloadedTheme.id === theme.id));
      if (matchingThemes.length > 0) {
        matchingThemes.forEach((theme) => {
          browser.runtime.sendMessage({
            type: 'DeleteDownloadedTheme',
            body: theme.id
          })
        })
      }

    } catch (error) {
      console.error('Error fetching themes:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchThemes();
  }, []);

  const handleThemeSelect = useCallback(
    async (themeId: string) => {
      if (themeId === settingsState.selectedTheme) {
        await disableTheme();
        setSelectedTheme('');
      } else {
        const selectedTheme = themes.find((theme) => theme.id === themeId);
        if (selectedTheme) {
          await setTheme(selectedTheme.id);
          setSelectedTheme(themeId);
        }
      }
    },
    [settingsState.selectedTheme, themes]
  );

  const handleThemeSelectDebounced = debounce(handleThemeSelect, 50);

  const handleThemeDelete = useCallback(
    async (themeId: string) => {
      try {
        await deleteTheme(themeId);
        setThemes((prevThemes) => prevThemes.filter((theme) => theme.id !== themeId));
        if (themeId === settingsState.selectedTheme) {
          setSelectedTheme('');
        }
      } catch (error) {
        console.error('Error deleting theme:', error);
      }
    },
    [settingsState.selectedTheme]
  );

  if (isLoading) {
    return <div className='text-center'>Loading themes...</div>;
  }

  return (
    <div className="my-3">
      <h2 className="pb-2 text-lg font-bold">Themes</h2>
      <div className="flex flex-col gap-2">
        {themes.map((theme) => (
          <ThemeCover
            key={theme.id}
            theme={theme}
            isSelected={theme.id === settingsState.selectedTheme}
            isEditMode={isEditMode}
            onThemeSelect={handleThemeSelectDebounced}
            onThemeDelete={handleThemeDelete}
          />
        ))}

        {downloadedThemes.map((theme) => (
          <ThemeCover
            key={theme.id}
            downloaded={true}
            theme={theme}
            isSelected={theme.id === settingsState.selectedTheme}
            isEditMode={isEditMode}
            onThemeSelect={handleThemeSelectDebounced}
            onThemeDelete={handleThemeDelete}
          />
        ))}

        <div
          id="divider"
          className="w-full h-[1px] my-2 bg-zinc-100 dark:bg-zinc-600"
        ></div>

        <button
          onClick={() => browser.tabs.create({ url: browser.runtime.getURL('src/interface/index.html#store')})}
          className="flex items-center justify-center w-full transition aspect-theme rounded-xl bg-zinc-100 dark:bg-zinc-900 dark:text-white"
        >
          <span className="text-xl font-IconFamily">{'\uecc5'}</span>
          <span className="ml-2">Theme Store</span>
        </button>

        <button
          onClick={() => browser.runtime.sendMessage({ type: 'currentTab', info: 'OpenThemeCreator' })}
          className="flex items-center justify-center w-full transition aspect-theme rounded-xl bg-zinc-100 dark:bg-zinc-900 dark:text-white"
        >
          <span className="text-xl font-IconFamily">{'\uec60'}</span>
          <span className="ml-2">Create your own</span>
        </button>
      </div>
    </div>
  );
});

export default ThemeSelector;