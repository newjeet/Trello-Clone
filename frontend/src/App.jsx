import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BoardsPage from './components/BoardsPage/BoardsPage';
import BoardView from './components/BoardView/BoardView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BoardsPage />} />
        <Route path="/board/:boardId" element={<BoardView />} />
      </Routes>
    </Router>
  );
}

export default App;
