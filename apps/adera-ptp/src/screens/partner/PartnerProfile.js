import React from 'react';
import { ProfileScreen } from '@adera/ui';
import { useProfileSettings } from '@adera/ui/src/hooks/useProfileSettings';

const PartnerProfile = () => {
  const { user, menuItems, appVersion } = useProfileSettings('partner');
  return <ProfileScreen user={user} menuItems={menuItems} appVersion={appVersion} />;
};

export default PartnerProfile;
