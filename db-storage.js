/**
 * ═══════════════════════════════════════════════════════════════
 * SALUD-CONECTA — Storage Persistente con IndexedDB + localStorage
 * ═══════════════════════════════════════════════════════════════
 * Almacenamiento multi-capa que persiste incluso si se borra el historial
 * - IndexedDB: Almacenamiento principal (más resistente)
 * - localStorage: Caché secundaria (más rápido)
 * - Sincronización automática entre ambos
 */

class SaludConectaDB {
  constructor() {
    this.dbName = 'SaludConectaDB';
    this.version = 1;
    this.db = null;
    this.init();
  }

  // ═══════════════════════════════════════════════════════════════
  // INICIALIZACIÓN DE INDEXEDDB
  // ═══════════════════════════════════════════════════════════════
  
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('❌ Error abriendo IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB inicializado');
        resolve(this.db);
      };

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        
        // Crear object stores si no existen
        if (!db.objectStoreNames.contains('users')) {
          const usersStore = db.createObjectStore('users', { keyPath: 'userId' });
          usersStore.createIndex('pinHash', 'pinHash', { unique: true });
          console.log('📦 Object Store "users" creado');
        }

        if (!db.objectStoreNames.contains('profiles')) {
          const profilesStore = db.createObjectStore('profiles', { keyPath: 'userId' });
          profilesStore.createIndex('createdAt', 'createdAt');
          console.log('📦 Object Store "profiles" creado');
        }

        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
          console.log('📦 Object Store "sessions" creado');
        }

        if (!db.objectStoreNames.contains('appData')) {
          db.createObjectStore('appData', { keyPath: 'key' });
          console.log('📦 Object Store "appData" creado');
        }
      };
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // USUARIO - GUARDAR Y RECUPERAR
  // ═══════════════════════════════════════════════════════════════

  async saveUser(userId, pinHash) {
    try {
      const userData = {
        userId,
        pinHash,
        createdAt: new Date().toISOString()
      };

      // Guardar en IndexedDB
      const idbRequest = new Promise((resolve, reject) => {
        const tx = this.db.transaction(['users'], 'readwrite');
        const store = tx.objectStore('users');
        const req = store.put(userData);
        req.onsuccess = () => resolve(userData);
        req.onerror = () => reject(req.error);
      });

      await idbRequest;

      // Sincronizar con localStorage (caché)
      const users = JSON.parse(localStorage.getItem('sc_users') || '{}');
      users[userId] = { pinHash, createdAt: userData.createdAt };
      localStorage.setItem('sc_users', JSON.stringify(users));

      console.log(`✅ Usuario guardado: ${userId}`);
      return userData;
    } catch (error) {
      console.error('❌ Error guardando usuario:', error);
      throw error;
    }
  }

  async getUser(userId) {
    try {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(['users'], 'readonly');
        const store = tx.objectStore('users');
        const req = store.get(userId);
        
        req.onsuccess = () => {
          if (req.result) {
            resolve(req.result);
          } else {
            // Si no está en IndexedDB, intentar recuperar de localStorage
            const users = JSON.parse(localStorage.getItem('sc_users') || '{}');
            if (users[userId]) {
              resolve(users[userId]);
            } else {
              resolve(null);
            }
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch (error) {
      console.error('❌ Error recuperando usuario:', error);
      return null;
    }
  }

  async getAllUsers() {
    try {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(['users'], 'readonly');
        const store = tx.objectStore('users');
        const req = store.getAll();
        
        req.onsuccess = () => {
          resolve(req.result);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (error) {
      console.error('❌ Error recuperando todos los usuarios:', error);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PERFILES - GUARDAR Y RECUPERAR
  // ═══════════════════════════════════════════════════════════════

  async saveProfile(userId, profileData) {
    try {
      const profile = {
        userId,
        ...profileData,
        updatedAt: new Date().toISOString()
      };

      // Guardar en IndexedDB
      const idbRequest = new Promise((resolve, reject) => {
        const tx = this.db.transaction(['profiles'], 'readwrite');
        const store = tx.objectStore('profiles');
        const req = store.put(profile);
        req.onsuccess = () => resolve(profile);
        req.onerror = () => reject(req.error);
      });

      await idbRequest;

      // Sincronizar con localStorage (caché)
      const profiles = JSON.parse(localStorage.getItem('sc_profiles') || '{}');
      profiles[userId] = { ...profileData, updatedAt: profile.updatedAt };
      localStorage.setItem('sc_profiles', JSON.stringify(profiles));

      console.log(`✅ Perfil guardado: ${userId}`);
      return profile;
    } catch (error) {
      console.error('❌ Error guardando perfil:', error);
      throw error;
    }
  }

  async getProfile(userId) {
    try {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(['profiles'], 'readonly');
        const store = tx.objectStore('profiles');
        const req = store.get(userId);
        
        req.onsuccess = () => {
          if (req.result) {
            resolve(req.result);
          } else {
            // Si no está en IndexedDB, recuperar de localStorage
            const profiles = JSON.parse(localStorage.getItem('sc_profiles') || '{}');
            resolve(profiles[userId] || {});
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch (error) {
      console.error('❌ Error recuperando perfil:', error);
      return {};
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SESIÓN - GUARDAR Y RECUPERAR
  // ═══════════════════════════════════════════════════════════════

  async setSession(userId) {
    try {
      const session = {
        id: 'currentSession',
        userId,
        loginAt: Date.now()
      };

      // Guardar en IndexedDB
      const idbRequest = new Promise((resolve, reject) => {
        const tx = this.db.transaction(['sessions'], 'readwrite');
        const store = tx.objectStore('sessions');
        const req = store.put(session);
        req.onsuccess = () => resolve(session);
        req.onerror = () => reject(req.error);
      });

      await idbRequest;

      // Sincronizar con localStorage
      localStorage.setItem('sc_session', JSON.stringify(session));

      console.log(`✅ Sesión iniciada: ${userId}`);
      return session;
    } catch (error) {
      console.error('❌ Error estableciendo sesión:', error);
      throw error;
    }
  }

  async getSession() {
    try {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(['sessions'], 'readonly');
        const store = tx.objectStore('sessions');
        const req = store.get('currentSession');
        
        req.onsuccess = () => {
          if (req.result) {
            resolve(req.result);
          } else {
            // Si no está en IndexedDB, recuperar de localStorage
            const session = localStorage.getItem('sc_session');
            resolve(session ? JSON.parse(session) : null);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch (error) {
      console.error('❌ Error recuperando sesión:', error);
      return null;
    }
  }

  async clearSession() {
    try {
      // Limpiar de IndexedDB
      const idbRequest = new Promise((resolve, reject) => {
        const tx = this.db.transaction(['sessions'], 'readwrite');
        const store = tx.objectStore('sessions');
        const req = store.delete('currentSession');
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      await idbRequest;

      // Limpiar de localStorage
      localStorage.removeItem('sc_session');

      console.log('✅ Sesión limpiada');
    } catch (error) {
      console.error('❌ Error limpiando sesión:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // DATOS DE APP - CONFIGURACIONES VARIAS
  // ═══════════════════════════════════════════════════════════════

  async setAppData(key, value) {
    try {
      const data = { key, value, timestamp: Date.now() };

      const idbRequest = new Promise((resolve, reject) => {
        const tx = this.db.transaction(['appData'], 'readwrite');
        const store = tx.objectStore('appData');
        const req = store.put(data);
        req.onsuccess = () => resolve(data);
        req.onerror = () => reject(req.error);
      });

      await idbRequest;
      console.log(`✅ AppData guardado: ${key}`);
    } catch (error) {
      console.error('❌ Error guardando app data:', error);
    }
  }

  async getAppData(key) {
    try {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(['appData'], 'readonly');
        const store = tx.objectStore('appData');
        const req = store.get(key);
        
        req.onsuccess = () => {
          resolve(req.result ? req.result.value : null);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (error) {
      console.error('❌ Error recuperando app data:', error);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SINCRONIZACIÓN COMPLETA
  // ═══════════════════════════════════════════════════════════════

  async syncAllData() {
    try {
      console.log('🔄 Iniciando sincronización de datos...');
      
      // Si localStorage se borró, restaurar desde IndexedDB
      const users = await this.getAllUsers();
      if (users.length > 0 && !localStorage.getItem('sc_users')) {
        const usersObj = {};
        for (const user of users) {
          usersObj[user.userId] = { 
            pinHash: user.pinHash, 
            createdAt: user.createdAt 
          };
        }
        localStorage.setItem('sc_users', JSON.stringify(usersObj));
        console.log('✅ Usuarios restaurados desde IndexedDB');
      }

      // Restaurar sesión si fue borrada de localStorage
      const session = await this.getSession();
      if (session && !localStorage.getItem('sc_session')) {
        localStorage.setItem('sc_session', JSON.stringify(session));
        console.log('✅ Sesión restaurada desde IndexedDB');
      }

      console.log('✅ Sincronización completada');
    } catch (error) {
      console.error('❌ Error en sincronización:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // LIMPIAR TODA LA BASE DE DATOS (Logout completo)
  // ═══════════════════════════════════════════════════════════════

  async clearAllData() {
    try {
      const stores = ['users', 'profiles', 'sessions', 'appData'];
      
      for (const storeName of stores) {
        await new Promise((resolve, reject) => {
          const tx = this.db.transaction([storeName], 'readwrite');
          const store = tx.objectStore(storeName);
          const req = store.clear();
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      }

      // Limpiar localStorage también
      localStorage.removeItem('sc_users');
      localStorage.removeItem('sc_profiles');
      localStorage.removeItem('sc_session');
      
      console.log('✅ Toda la base de datos ha sido limpiada');
    } catch (error) {
      console.error('❌ Error limpiando base de datos:', error);
      throw error;
    }
  }
}

// Crear instancia global
const saludConectaDB = new SaludConectaDB();

// Exportar para módulos (si usas módulos)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = saludConectaDB;
}
