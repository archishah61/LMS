// context/PermissionWrapper.jsx
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useGetAdminPermissionsQuery } from '../services/adminAuthApi';
import { setAdminPermissions } from '../features/adminSlice';
import { getAdminToken } from '../services/CookieService';

// // Create a custom hook for permission checking
// export const usePermissions = () => {
//   const userPermissions = useSelector((state) => state.admin.adminPermissions);

//   const hasPermission = (section, action) => {
//     return userPermissions?.some(
//       (permission) => permission.section === section && permission.action === action
//     ) || false;
//   };

//   return { hasPermission };
// };

export const usePermissions = () => {
  const userPermissions = useSelector((state) => state.admin.adminPermissions);

  const checkPermission = (section, singleAction) => {
    return userPermissions?.some(
      (permission) =>
        permission.section === section && permission.action === singleAction
    );
  };

  const hasPermission = (section, action) => {
    if (!section) return false;

    if (!action) {
      if (section.includes('&')) {
        const sections = section.split('&').map(s => s.trim());
        return sections.every((sec) =>
          userPermissions?.some((permission) => permission.section === sec)
        );
      } else if (section.includes('|')) {
        const sections = section.split('|').map(s => s.trim());
        return sections.some((sec) =>
          userPermissions?.some((permission) => permission.section === sec)
        );
      } else {
        // Single section check
        return userPermissions?.some(
          (permission) => permission.section === section
        ) || false;
      }
    }

    if(section.includes('&')||section.includes('|')){
      return false;
    }

    if (action.includes('&')) {
      const actions = action.split('&').map(a => a.trim());
      return actions.every((act) => checkPermission(section, act));
    } else if (action.includes('|')) {
      const actions = action.split('|').map(a => a.trim());
      return actions.some((act) => checkPermission(section, act));
    } else {
      return checkPermission(section, action);
    }
  };

  return { hasPermission };
};

const PermissionWrapper = ({ section, action, children }) => {
  const dispatch = useDispatch();
  const { hasPermission } = usePermissions();
  const userPermissions = useSelector((state) => state.admin.adminPermissions);

  // Get the admin token
  const { access_token } = getAdminToken();

  // Use skip parameter to control when the query runs
  const {
    data: permissionsData,
    refetch,
    isSuccess
  } = useGetAdminPermissionsQuery(access_token, {
    skip: !access_token || !!userPermissions
  });

  useEffect(() => {
    if (access_token && !userPermissions) {
      refetch();
    }

    if (isSuccess && permissionsData) {
      dispatch(setAdminPermissions({ adminPermissions: permissionsData.data }));
    }
  }, [access_token, userPermissions, permissionsData, isSuccess, dispatch, refetch]);

  // Show loading state or null while permissions are being fetched
  if (!userPermissions && access_token) {
    return null;
  }

  return hasPermission(section, action) ? children : null;
};

export default PermissionWrapper;
