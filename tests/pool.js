import hamsters from '../src/hamsters';

// Describe block for testing Hamsters Pool functionality
describe("Hamsters Pool", () => {

  if(hamsters && typeof hamsters.pool.threads === 'undefined') {
    hamsters.init();
  }
  
  let hamstersPool = hamsters.pool;

  // Test case for checking if threads is an array
  it("Threads should be an array", () => {
    expect(Array.isArray(hamstersPool.threads)).toEqual(true);
  });

  // Test case for checking if running is an array
  it("Running should be an array", () => {
    expect(Array.isArray(hamstersPool.running)).toEqual(true);
  });

  // Test case for checking if pending is an array
  it("Pending should be an array", () => {
    expect(Array.isArray(hamstersPool.pending)).toEqual(true);
  });

  // Test case for checking if running is an empty array
  it("Running should be an empty array", () => {
    expect(hamstersPool.running.length).toEqual(0);
  });

  // Test case for checking if pending is an empty array
  it("Pending should be an empty array", () => {
    expect(hamstersPool.pending.length).toEqual(0);
  });
});
