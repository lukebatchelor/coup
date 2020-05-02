import React from 'react';

// @ts-ignore react-dom types seem to be super buggy, not importing them
import ReactDom from 'react-dom';

function App() {
  return <div>App</div>;
}

ReactDom.render(<App />, document.getElementById('root'));
