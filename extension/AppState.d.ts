interface AppState {
  userSettings: {
    selectedChannelID: string | null;
  };
  channels: ChannelState[];
}

interface ChannelState {
  channelID: string;
  channelDisplayName: string;
  channelLoginName: string;

  predictionSettings: {
    status: 'active' | 'locked' | 'none',
    // non-null if .status !== 'none':
    outcomes: {color: string, iconURI: string, name: string}[] | null,
    // non-null if .status !== 'none':
    title: string | null,
    // non-null if .status === 'active'
    deadlineTimeMS: number | null,
  };
  userSettings: {
    predictionRatios: number[],
    pointLimit: number | null,
    secondsBeforeDeadline: number | null,
    enabled: boolean,
  };
  submission: null | {
    points: number,
    // TODO(strager): outcomeIndex
  };
}
