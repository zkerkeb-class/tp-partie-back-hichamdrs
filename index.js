
import express from 'express';
import cors from 'cors';
import pokemon from './schema/pokemon.js';

import './connect.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/assets', express.static('assets'));

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// GET tous les pokemons avec pagination (20 par 20)
app.get('/pokemons', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        const pokemons = await pokemon.find({}).skip(skip).limit(limit);
        const total = await pokemon.countDocuments();

        res.json({
            pokemons,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalPokemons: total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET un pokemon par ID
app.get('/pokemons/:id', async (req, res) => {
    try {
        const poke = await pokemon.findOne({ id: req.params.id });
        if (poke) {
            res.json(poke);
        } else {
            res.status(404).json({ error: 'Pokemon not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET recherche par nom (recherche partielle, insensible à la casse)
app.get('/search', async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) {
            return res.status(400).json({ error: 'Name parameter is required' });
        }

        const pokemons = await pokemon.find({
            $or: [
                { 'name.english': { $regex: name, $options: 'i' } },
                { 'name.french': { $regex: name, $options: 'i' } }
            ]
        });

        res.json(pokemons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST créer un nouveau pokemon
app.post('/pokemons', async (req, res) => {
    try {
        // Trouver le dernier ID pour auto-incrémenter
        const lastPokemon = await pokemon.findOne().sort({ id: -1 });
        const newId = lastPokemon ? lastPokemon.id + 1 : 1;

        const newPokemon = new pokemon({
            id: newId,
            ...req.body
        });

        const savedPokemon = await newPokemon.save();
        res.status(201).json(savedPokemon);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT mettre à jour un pokemon
app.put('/pokemons/:id', async (req, res) => {
    try {
        const updatedPokemon = await pokemon.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true, runValidators: true }
        );

        if (updatedPokemon) {
            res.json(updatedPokemon);
        } else {
            res.status(404).json({ error: 'Pokemon not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE supprimer un pokemon
app.delete('/pokemons/:id', async (req, res) => {
    try {
        const deletedPokemon = await pokemon.findOneAndDelete({ id: req.params.id });

        if (deletedPokemon) {
            res.json({ message: 'Pokemon deleted successfully', pokemon: deletedPokemon });
        } else {
            res.status(404).json({ error: 'Pokemon not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});