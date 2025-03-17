import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  Persistor
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Import slices
import documentsReducer from './slices/documentsSlice';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';

// Add error handling for persisted state
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Only persist auth state
};

const rootReducer = combineReducers({
  documents: documentsReducer,
  ui: uiReducer,
  auth: authReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with error handling
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  // Add dev tools in development only
  devTools: import.meta.env.MODE !== 'production',
});

// Create persistor safely
export let persistor: Persistor;
try {
  persistor = persistStore(store);
} catch (error) {
  console.error('Failed to create persistor:', error);
  // Create a fallback if persistence fails
  persistor = persistStore(store, {}, () => {});
}

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 