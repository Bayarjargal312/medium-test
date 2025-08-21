package com.example.backend.comment;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import com.example.backend.post.PostRepository;

@RestController
@RequestMapping("/api/comments")
@CrossOrigin(origins = "*")
public class CommentController {
    private final CommentRepository commentRepository;
    private final PostRepository postRepository;

    public CommentController(CommentRepository commentRepository, PostRepository postRepository) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
    }

    public record CreateRequest(String postSlug,
                                String parentId,
                                String author,
                                String content) {}

    @GetMapping("/{postSlug}")
    public ResponseEntity<?> list(@PathVariable String postSlug) {
        List<Comment> comments = commentRepository.findByPostSlugOrderByCreatedAtEpochMsAsc(postSlug);
        return ResponseEntity.ok(comments);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateRequest body) {
        Comment c = new Comment();
        c.setPostSlug(body.postSlug());
        c.setParentId(body.parentId());
        c.setAuthor(body.author() != null && !body.author().trim().isEmpty() ? body.author() : "Anonymous");
        c.setContent(body.content());
        c.setCreatedAtEpochMs(System.currentTimeMillis());
        commentRepository.save(c);
        
        // Update post comment count
        try {
            var post = postRepository.findBySlug(body.postSlug());
            if (post != null) {
                post.setCommentCount(post.getCommentCount() + 1);
                postRepository.save(post);
            }
        } catch (Exception ignore) {}
        
        return ResponseEntity.ok(Map.of("id", c.getId()));
    }
}


