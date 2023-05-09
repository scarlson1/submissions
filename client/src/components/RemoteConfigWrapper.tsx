import {
  RemoteConfig,
  RemoteConfigSettings,
  fetchAndActivate,
  getRemoteConfig,
} from 'firebase/remote-config';
import React from 'react';
import { RemoteConfigProvider, useInitRemoteConfig } from 'reactfire';

export const RemoteConfigWrapper: React.FC<{
  children: React.ReactNode;
  settings?: RemoteConfigSettings;
  defaults?: RemoteConfig['defaultConfig'];
}> = ({ children, settings = {}, defaults = {} }) => {
  const { data: remoteConfigInstance } = useInitRemoteConfig(async (firebaseApp) => {
    const remoteConfig = getRemoteConfig(firebaseApp);
    remoteConfig.settings = {
      minimumFetchIntervalMillis: 10000000, // Defaults to 43200000 (Twelve hours).
      fetchTimeoutMillis: 10000,
      ...settings,
    };
    remoteConfig.defaultConfig = { welcome_message: 'Welcome', ...defaults };
    await fetchAndActivate(remoteConfig);
    return remoteConfig;
  });

  return <RemoteConfigProvider sdk={remoteConfigInstance}>{children}</RemoteConfigProvider>;
};

// USAGE:

// export const RemoteConfig = () => {
//   return (
//     <SuspenseWithPerf traceId={'remote-config-message'} fallback={<LoadingSpinner />}>
//       <RemoteConfigWrapper>
//         <RcString messageKey='message' />
//       </RemoteConfigWrapper>
//     </SuspenseWithPerf>
//   );
// };

// export const RcString = ({ messageKey }) => {
//   const { data: messageValue } = useRemoteConfigString(messageKey);

//   return (
//     <CardSection title="Retrieve string 'message'">
//       <span>{messageValue}</span>
//     </CardSection>
//   );
// };

// GETTING A VALUE IN COMPONENT: https://firebase.google.com/docs/remote-config/get-started?platform=web#get-parameter

// import { getValue } from 'firebase/remote-config';

// const val = getValue(remoteConfig, 'welcome_messsage');
