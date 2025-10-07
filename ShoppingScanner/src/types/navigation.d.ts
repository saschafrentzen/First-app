import { Navigation } from '@react-navigation/native';

declare global {
  namespace ReactNavigation {
    interface RootParamList {
      HouseholdList: undefined;
      HouseholdDetail: {
        householdId: string;
      };
      HouseholdSettings: {
        householdId: string;
      };
      ListSelection: {
        householdId: string;
      };
      SharedList: {
        shareId: string;
      };
      InviteMember: {
        householdId: string;
      };
    }
  }
}