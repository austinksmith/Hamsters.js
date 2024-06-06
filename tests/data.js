import hamsters from '../src/hamsters';

// Describe block for testing Hamsters Data functionality
describe("Hamsters Data", () => {

  if(hamsters && typeof hamsters.data.getSubArrayIndexes === 'undefined') {
    hamsters.init();
  }

  let Data = hamsters.data;

  // Test case for the function that calculates array indexes
  it("getSubrrayIndexes should calculate array indexes", () => {
    const array = [1,2,3,4];
    const numberOfThreads = 2;
    // Getting array indexes using Hamsters Data class method
    const indexes = Data.getSubArrayIndexes(array, numberOfThreads);
    const size = Math.ceil(array.length/numberOfThreads);
    for (let i = 0; i < numberOfThreads; i += size) {
      // Checking if the calculated indexes match the expected values
      expect(indexes[i].start).toEqual(i);
      expect(indexes[i].end).toEqual(((i + size) - 1));
    }
  });

  // Test case for the function that returns a subarray using index
  it("getSubArrayFromIndex should return subarray using index", () => {
    const index = {start: 1, end: 3};
    const dataArray = [1,2,3,4];
    const task = {
      input: {
        array: dataArray
      }
    }
    // Getting subarray using index from Hamsters Data class method
    const output = Data.getSubArrayFromIndex(index, task);
    // Checking if the output matches the expected subarray
    expect(output[0]).toEqual(2);
    expect(output[1]).toEqual(3);
    expect(output[2]).toEqual(4);
  });

  // Test case for preparing a function (converting it to string)
  it("prepareFunction should convert function to string", () => {
    // Defining a function to be prepared
    let preparedJob = Data.prepareFunction(() => {
      console.log('All your cores are belong to me');
    });
    // Checking if the prepared function is of type string and contains expected content
    expect(typeof preparedJob).toEqual('string');
    expect(preparedJob.indexOf('console.log')).not.toBe(-1);
  });

  // Describe block for testing different sorting options
  describe("sortOutput options", () => {
    let sortOptions = ['asc', 'desc', 'ascAlpha', 'descAlpha'];
    let numberArray = [1, 2, 3, 4];
    let stringArray = ['One', 'Two', 'Three', 'Four'];
    let i = 0;
    let sorted = null;
    let selection = null;
    // Iterating over different sorting options
    for (i; i < sortOptions.length; i++) {
      // Determining if the sorting option is for alphanumeric sorting
      if(sortOptions[i].indexOf('Alpha') !== -1) {
        // Sorting alphanumeric array using Hamsters Data class method
        sorted = Data.sortOutput(new Array(stringArray), sortOptions[i]);
        selection = stringArray;
      } else {
        // Sorting numeric array using Hamsters Data class method
        sorted = Data.sortOutput(new Array(numberArray), sortOptions[i]);
        selection = numberArray;
      }
      // Test case for each sorting option
      it("sortOutput " + sortOptions[i] + " should sort array", () => {
        // Checking if the sorted array is not equal to the original array
        expect(sorted).not.toEqual(selection);
      });
    }
  });

});
