import {createPersonalBrowserMembershipProfile} from '../../profiles/personal/browser-membership.ts';

type ProfileConfig = Parameters<typeof createPersonalBrowserMembershipProfile>[0];
type NativeEntry = {
  selectProject(): Promise<Pick<ProfileConfig, 'projectRoot' | 'display_name' | 'mode'> | null>;
  openBrowser(url: string): Promise<void>;
};

/** Native selection owns the path; the browser receives only the one-use bootstrap. */
export async function launchBrowserCompanion(config: Omit<ProfileConfig, 'projectRoot' | 'display_name'> & {native: NativeEntry}) {
  const selected = await config.native.selectProject();
  if (selected === null) return null;
  const profile = await createPersonalBrowserMembershipProfile({...selected, originDirectory:config.originDirectory, toolchain: config.toolchain, model: config.model});
  try {
    await config.native.openBrowser(`${profile.origin}/#${profile.bootstrap}`);
  } catch (error) {
    await profile.close();
    throw error;
  }
  return {...profile, open: () => config.native.openBrowser(`${profile.origin}/`)};
}
