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

  // Test case for checking if prepareMeal constructs params object variables
  it("prepareMeal should construct params object variables", () => {
    let taskInput = {
      hamstersJob: `function() { console.log('The ISOs, they were going to be my gift to the world.') }`,
      array: [1, 2, 3, 4],
      ranVar: 'hamster powered',
      dataType: 'Int32'
    };
    let task = {
      id: 1,
      input: taskInput
    };
    let meal = hamstersPool.prepareMeal(taskInput.array, task);
    expect(typeof meal).toEqual('object');
    expect(meal.hamstersJob).toEqual(taskInput.hamstersJob);
    expect(meal.dataType).toEqual('Int32');
    expect(meal.ranVar).toEqual('hamster powered');
  });
});
