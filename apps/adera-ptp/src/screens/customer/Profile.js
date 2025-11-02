import React from 'react';
import { ProfileScreen } from '@adera/ui';
import { useProfileSettings } from '@adera/ui/src/hooks/useProfileSettings';

const Profile = () => {
  const { user, menuItems, appVersion } = useProfileSettings('customer');
  return <ProfileScreen user={user} menuItems={menuItems} appVersion={appVersion} />;
};

export default Profile;
