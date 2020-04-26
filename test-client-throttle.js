
describe('Testing the validator', () => {
  it('should show error for invalid url', () => {
    let result = validateURL("this isn't a url!");

    expect(result.valid).toBe(false);
    expect(result.msg).toBe("Error: URL is invalid.");
  });
  // it('should show error for too lengthy url', ()=>{
  //   
  // });
  // it('should allow valid url', ()=>{
  //   
  // });
});
