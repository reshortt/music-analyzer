import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 