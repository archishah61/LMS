// Redux Logger Middleware
export const reduxLogger = store => next => action => {
  // Log only specific actions we care about
  if (action.type && action.type.includes('course_time_tracking')) {
    console.group(`%cRedux Action: ${action.type}`, 'color: #4CAF50; font-weight: bold');
    
    console.log('%cPrevious State:', 'color: #9E9E9E; font-weight: bold', {
      ...store.getState().courseTimeTracking
    });
    console.log('%cAction:', 'color: #03A9F4; font-weight: bold', action);
    
    const result = next(action);
    
    console.log('%cNext State:', 'color: #FF5722; font-weight: bold', {
      ...store.getState().courseTimeTracking
    });
    
    console.groupEnd();
    return result;
  }
  
  return next(action);
};
