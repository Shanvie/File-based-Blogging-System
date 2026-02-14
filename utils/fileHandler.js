const fs = require('fs').promises;
const path = require('path');
const slugify = require('slugify');
const { v4: uuidv4 } = require('uuid');

const POSTS_DIR = path.join(__dirname, '..', 'posts');

/**
 * Generate a unique filename for a post
 * @param {string} title - Post title
 * @returns {string} - Unique filename
 */
const generateFilename = (title) => {
    const slug = slugify(title, { lower: true, strict: true });
    const uniqueId = uuidv4().substring(0, 8);
    return `${slug}-${uniqueId}.json`;
};

/**
 * Get all blog posts
 * @returns {Promise<Array>} - Array of post objects
 */
const getAllPosts = async () => {
    try {
        const files = await fs.readdir(POSTS_DIR);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        const posts = await Promise.all(
            jsonFiles.map(async (file) => {
                const filePath = path.join(POSTS_DIR, file);
                const content = await fs.readFile(filePath, 'utf-8');
                const post = JSON.parse(content);
                post.filename = file.replace('.json', '');
                return post;
            })
        );
        
        // Sort posts by date (newest first)
        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        return posts;
    } catch (error) {
        console.error('Error reading posts:', error);
        return [];
    }
};

/**
 * Get a single post by filename
 * @param {string} filename - Post filename (without extension)
 * @returns {Promise<Object|null>} - Post object or null
 */
const getPostByFilename = async (filename) => {
    try {
        const filePath = path.join(POSTS_DIR, `${filename}.json`);
        const content = await fs.readFile(filePath, 'utf-8');
        const post = JSON.parse(content);
        post.filename = filename;
        return post;
    } catch (error) {
        console.error(`Error reading post ${filename}:`, error);
        return null;
    }
};

/**
 * Create a new blog post
 * @param {Object} postData - Post data (title, content, author)
 * @returns {Promise<Object>} - Created post object
 */
const createPost = async (postData) => {
    const { title, content, author, tags } = postData;
    
    const post = {
        id: uuidv4(),
        title: title.trim(),
        content: content.trim(),
        author: author ? author.trim() : 'Anonymous',
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    const filename = generateFilename(title);
    const filePath = path.join(POSTS_DIR, filename);
    
    await fs.writeFile(filePath, JSON.stringify(post, null, 2), 'utf-8');
    
    post.filename = filename.replace('.json', '');
    return post;
};

/**
 * Update an existing blog post
 * @param {string} filename - Post filename (without extension)
 * @param {Object} postData - Updated post data
 * @returns {Promise<Object|null>} - Updated post object or null
 */
const updatePost = async (filename, postData) => {
    try {
        const filePath = path.join(POSTS_DIR, `${filename}.json`);
        const existingContent = await fs.readFile(filePath, 'utf-8');
        const existingPost = JSON.parse(existingContent);
        
        const updatedPost = {
            ...existingPost,
            title: postData.title ? postData.title.trim() : existingPost.title,
            content: postData.content ? postData.content.trim() : existingPost.content,
            author: postData.author ? postData.author.trim() : existingPost.author,
            tags: postData.tags ? postData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : existingPost.tags,
            updatedAt: new Date().toISOString()
        };
        
        await fs.writeFile(filePath, JSON.stringify(updatedPost, null, 2), 'utf-8');
        
        updatedPost.filename = filename;
        return updatedPost;
    } catch (error) {
        console.error(`Error updating post ${filename}:`, error);
        return null;
    }
};

/**
 * Delete a blog post
 * @param {string} filename - Post filename (without extension)
 * @returns {Promise<boolean>} - Success status
 */
const deletePost = async (filename) => {
    try {
        const filePath = path.join(POSTS_DIR, `${filename}.json`);
        await fs.unlink(filePath);
        return true;
    } catch (error) {
        console.error(`Error deleting post ${filename}:`, error);
        return false;
    }
};

/**
 * Search posts by title or content
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of matching posts
 */
const searchPosts = async (query) => {
    const allPosts = await getAllPosts();
    const lowerQuery = query.toLowerCase();
    
    return allPosts.filter(post => 
        post.title.toLowerCase().includes(lowerQuery) ||
        post.content.toLowerCase().includes(lowerQuery) ||
        post.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
};

/**
 * Get posts by tag
 * @param {string} tag - Tag to filter by
 * @returns {Promise<Array>} - Array of posts with the tag
 */
const getPostsByTag = async (tag) => {
    const allPosts = await getAllPosts();
    return allPosts.filter(post => 
        post.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    );
};

module.exports = {
    getAllPosts,
    getPostByFilename,
    createPost,
    updatePost,
    deletePost,
    searchPosts,
    getPostsByTag
};