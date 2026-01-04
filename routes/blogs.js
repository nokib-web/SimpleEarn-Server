import express from 'express';
import { ObjectId } from 'mongodb';
import { Blogs } from '../config/collections.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all blogs (Public)
router.get('/', async (req, res) => {
    try {
        const { search, page = 1, limit = 9 } = req.query;
        const query = search ? {
            $or: [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ]
        } : {};

        const totalBlogs = await Blogs().countDocuments(query);
        const blogs = await Blogs().find(query)
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .toArray();

        res.json({
            blogs,
            totalPages: Math.ceil(totalBlogs / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Get blogs error:', error);
        res.status(500).json({ message: 'Error fetching blogs', error: error.message });
    }
});

// Get single blog (Public)
router.get('/:id', async (req, res) => {
    try {
        const blog = await Blogs().findOne({ _id: new ObjectId(req.params.id) });
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        res.json(blog);
    } catch (error) {
        console.error('Get blog error:', error);
        res.status(500).json({ message: 'Error fetching blog', error: error.message });
    }
});

// Create blog (Admin only)
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { title, content, image, tags, readTime } = req.body;

        if (!title || !content || !image) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newBlog = {
            title,
            content,
            image,
            tags: tags || [],
            readTime: readTime || '5 min read',
            author: {
                name: req.userDoc.name,
                image: req.userDoc.photo
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await Blogs().insertOne(newBlog);
        res.status(201).json({ ...newBlog, _id: result.insertedId });
    } catch (error) {
        console.error('Create blog error:', error);
        res.status(500).json({ message: 'Error creating blog', error: error.message });
    }
});

// Update blog (Admin only)
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { title, content, image, tags, readTime } = req.body;
        const updateData = {
            ...(title && { title }),
            ...(content && { content }),
            ...(image && { image }),
            ...(tags && { tags }),
            ...(readTime && { readTime }),
            updatedAt: new Date()
        };

        const result = await Blogs().findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result.value) {
            // For older mongodb driver versions
            const updatedDoc = await Blogs().findOne({ _id: new ObjectId(req.params.id) });
            if (!updatedDoc) return res.status(404).json({ message: 'Blog not found' });
            return res.json(updatedDoc);
        }

        res.json(result.value);
    } catch (error) {
        console.error('Update blog error:', error);
        res.status(500).json({ message: 'Error updating blog', error: error.message });
    }
});

// Delete blog (Admin only)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const result = await Blogs().deleteOne({ _id: new ObjectId(req.params.id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        res.json({ message: 'Blog deleted successfully' });
    } catch (error) {
        console.error('Delete blog error:', error);
        res.status(500).json({ message: 'Error deleting blog', error: error.message });
    }
});

export default router;
