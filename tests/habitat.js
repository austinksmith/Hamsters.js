import hamsters from '../src/hamsters';

// Describe block for testing Hamsters Habitat functionality
describe("Hamsters Habitat", () => {

  if(hamsters && typeof hamsters.habitat.determineGlobalThreads === 'undefined') {
    hamsters.init();
  }

  let Habitat = hamsters.habitat;
  // Test case for determining the number of global threads
  it("determineGlobalThreads should return a number", () => {
    expect(typeof Habitat.determineGlobalThreads()).toBe("number");
  });

  // Test case for checking if the environment is not legacy
  it("isLegacyEnvironment should return false", () => {
    expect(Habitat.isLegacyEnvironment()).toEqual(false);
  });

  // Test case for checking if support for SharedWorkers is boolean
  it("supportsSharedWorkers should be boolean", () => {
    expect(Habitat.supportsSharedWorkers()).toMatch(/true|false/);
  });

  // Test case for detecting logical threads
  it("Logical Threads should be detected", () => {
    expect(Habitat['maxThreads']).not.toBe(null);
  });

  // Test case for matching logical threads with navigator.hardwareConcurrency
  it("Logical threads should match navigator.hardwareConcurrency", () => {
    expect(Habitat['maxThreads']).toEqual(navigator.hardwareConcurrency || 4);
  })

  // Test case for checking if persistence is boolean
  it("Persistence should be boolean", () => {
    expect(Habitat['persistence']).toMatch(/true|false/);
  });

  // Test case for checking if memoization is boolean
  it("Memoize should be boolean", () => {
    expect(Habitat['memoize']).toMatch(/true|false/);
  });

  // Test case for checking if importScripts is null
  it("ImportScripts should be null", () => {
    expect(Habitat['importScripts']).toBe(null);
  });

  // Test case for checking if debug is boolean
  it("Debug should be boolean", () => {
    expect(Habitat['debug']).toMatch(/true|false/);
  });

  // Test case for checking if Node environment is boolean
  it("Node should be boolean", () => {
    expect(Habitat['node']).toMatch(/true|false/);
  });
  
  // Test case for checking if Browser environment is boolean
  it("Browser should be boolean", () => {
    expect(Habitat['browser']).toMatch(/true|false/);
  });

  // Test case for checking if Internet Explorer is boolean
  it("isIE should be boolean", () => {
    expect(Habitat.isInternetExplorer()).toMatch(/true|false/);
  });
  
  // Test case for checking if support for Atomics is boolean
  it("Atomics should be boolean", () => {
    expect(Habitat['atomics']).toMatch(/true|false/);
  });

  // Test case for checking if legacy environment is boolean
  it("Legacy should be boolean", () => {
    expect(Habitat['legacy']).toMatch(/true|false/);
  });

  // Test case for checking if WebWorker environment is boolean
  it("WebWorker should be boolean", () => {
    expect(Habitat['webWorker']).toMatch(/true|false/);
  });

  // Test case for checking if Shell environment is boolean
  it("Shell should be boolean", () => {
    expect(Habitat['shell']).toMatch(/true|false/);
  });
  
  // Test case for checking if transferable objects support is boolean
  it("transferable should be boolean", () => {
    expect(Habitat['transferable']).toMatch(/true|false/);
  });

  // Test case for checking if support for Proxies is boolean
  it("Proxies should be boolean", () => {
    expect(Habitat['proxies']).toMatch(/true|false/);
  });

  // Test case for checking if React Native environment is boolean
  it("reactNative should be boolean", () => {
    expect(Habitat['reactNative']).toMatch(/true|false/);
  });

  // Test case for checking if Blob Builder is a string
  it("locateBlobBuilder should return string", () => {
    let builder = Habitat.findAvailableBlobBuilder();
    expect(typeof builder).toBe('string');
  });

  // Test case for checking if generated Blob URI is valid
  it("generateBlob should generate blob with object url", () => {
    let dataBlobURI = Habitat.generateWorkerBlob(() => {
      console.log('History! Science, philosophy, every idea man has ever had about the Universe up for grabs.');
    });
    expect(dataBlobURI).not.toEqual(null);
    expect(typeof dataBlobURI).toEqual('string');
  });
  
  // Test case for checking if Worker is an object or function
  it("Worker should be an object or function", () => {
    const options = ['object', 'function'];
    expect(Habitat['Worker']).not.toBe(null);
    expect(options.indexOf(typeof Habitat['Worker'])).not.toBe(-1);
  });

  // Test case for checking if SharedWorker is an object or function
  it("SharedWorker should be an object or function", () => {
    const options = ['object', 'function'];
    expect(Habitat['sharedWorker']).not.toBe(null);
    expect(options.indexOf(typeof Habitat['sharedWorker'])).not.toBe(-1);
  });

  // Test case for checking if selectHamsterWheel has a value
  it("SelectHamsterWheel should have a value", () => {
    expect(typeof Habitat.selectHamsterWheel).not.toBe(null);
  });

});
