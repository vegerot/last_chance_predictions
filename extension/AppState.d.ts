type ChannelID = string;

declare interface AppState {
  userSettings: {
    selectedChannelID: ChannelID | null;
  };
  channels: { [channelID in ChannelID]: ChannelState };
}

declare interface ChannelState {
  channelID: string;
  channelDisplayName: string;
  channelLoginName: string;

  predictionSettings: {
    status: "active" | "locked" | "none";
    // non-null if .status !== 'none':
    predictionID: string | null;
    // non-null if .status !== 'none':
    outcomes: {
      outcomeID: string;
      color: string;
      iconURI: string;
      name: string;
    }[] | null;
    // non-null if .status !== 'none':
    title: string | null;
    // non-null if .status === 'active'
    deadlineTimeMS: number | null;
  };
  userSettings: {
    predictionRatios: number[];
    pointLimit: number | null;
    secondsBeforeDeadline: number | null;
    enabled: boolean;
  };
  submission: null | {
    points: number;
    outcomeIndex: number;
  };
}

type TabID = number;
/** ex. strager_sr */
type ChannelLoginName = string;
declare type TabChannels = Record<TabID, ChannelLoginName>;

/** returned from `setTimeout`*/
type TimerID = number;
declare type ChannelIdToTimeout = Record<ChannelLoginName, TimerID>;
