const express = require('express');
const router = express.Router();
const {
    getAllPosts,
    getPostByFilename,
    createPost,
    updatePost,
    deletePost,
    searchPosts,
    getPostsByTag
} = require('../utils/fileHandler');

// Home Route - Display all blog posts
router.get('/', async (req, res, next) => {
    try {
        const posts = await getAllPosts();
        res.render('index', {
            title: 'Blog Home',
            posts,
            message: req.query.message || null
        });
    } catch (error) {
        next(error);
    }
});

// Search Route - Search posts
router.get('/search', async (req, res, next) => {
    try {
        const query = req.query.q || '';
        const posts = query ? await searchPosts(query) : [];
        res.render('index', {
            title: `Search Results for "${query}"`,
            posts,
            searchQuery: query,
            message: posts.length === 0 ? 'No posts found matching your search.' : null
        });
    } catch (error) {
        next(error);
    }
});

// Tag Route - Filter posts by tag
router.get('/tag/:tag', async (req, res, next) => {
    try {
        const tag = req.params.tag;
        const posts = await getPostsByTag(tag);
        res.render('index', {
            title: `Posts tagged with "${tag}"`,
            posts,
            currentTag: tag,
            message: posts.length === 0 ? 'No posts found with this tag.' : null
        });
    } catch (error) {
        next(error);
    }
});

// New Post Route - Display form for creating a new post
router.get('/posts/new', (req, res) => {
    res.render('new', {
        title: 'Create New Post',
        error: null
    });
});

// Create Post Route - Handle form submission for new post
router.post('/posts', async (req, res, next) => {
    try {
        const { title, content, author, tags } = req.body;
        
        // Validation
        if (!title || !content) {
            return res.render('new', {
                title: 'Create New Post',
                error: 'Title and content are required!',
                formData: req.body
            });
        }
        
        const post = await createPost({ title, content, author, tags });
        res.redirect(`/posts/${post.filename}?message=Post created successfully!`);
    } catch (error) {
        next(error);
    }
});

// Read Post Route - Display a single blog post
router.get('/posts/:filename', async (req, res, next) => {
    try {
        const post = await getPostByFilename(req.params.filename);
        
        if (!post) {
            return res.status(404).render('error', {
                title: '404 - Post Not Found',
                message: 'The blog post you are looking for does not exist.',
                error: { status: 404 }
            });
        }
        
        res.render('show', {
            title: post.title,
            post,
            message: req.query.message || null
        });
    } catch (error) {
        next(error);
    }
});

// Edit Post Route - Display form for editing an existing post
router.get('/posts/:filename/edit', async (req, res, next) => {
    try {
        const post = await getPostByFilename(req.params.filename);
        
        if (!post) {
            return res.status(404).render('error', {
                title: '404 - Post Not Found',
                message: 'The blog post you are looking for does not exist.',
                error: { status: 404 }
            });
        }
        
        res.render('edit', {
            title: `Edit: ${post.title}`,
            post,
            error: null
        });
    } catch (error) {
        next(error);
    }
});

// Update Post Route - Handle form submission for updating a post
router.post('/posts/:filename', async (req, res, next) => {
    try {
        const { title, content, author, tags } = req.body;
        const filename = req.params.filename;
        
        // Validation
        if (!title || !content) {
            const post = await getPostByFilename(filename);
            return res.render('edit', {
                title: `Edit: ${post.title}`,
                post: { ...post, ...req.body },
                error: 'Title and content are required!'
            });
        }
        
        const updatedPost = await updatePost(filename, { title, content, author, tags });
        
        if (!updatedPost) {
            return res.status(404).render('error', {
                title: '404 - Post Not Found',
                message: 'The blog post you are trying to update does not exist.',
                error: { status: 404 }
            });
        }
        
        res.redirect(`/posts/${filename}?message=Post updated successfully!`);
    } catch (error) {
        next(error);
    }
});

// Delete Post Route - Handle deletion of a blog post
router.post('/posts/:filename/delete', async (req, res, next) => {
    try {
        const success = await deletePost(req.params.filename);
        
        if (!success) {
            return res.status(404).render('error', {
                title: '404 - Post Not Found',
                message: 'The blog post you are trying to delete does not exist.',
                error: { status: 404 }
            });
        }
        
        res.redirect('/?message=Post deleted successfully!');
    } catch (error) {
        next(error);
    }
});

// API Routes for AJAX operations
router.get('/api/posts', async (req, res, next) => {
    try {
        const posts = await getAllPosts();
        res.json({ success: true, data: posts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/api/posts/:filename', async (req, res, next) => {
    try {
        const post = await getPostByFilename(req.params.filename);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }
        res.json({ success: true, data: post });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;