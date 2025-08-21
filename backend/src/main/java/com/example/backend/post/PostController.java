package com.example.backend.post;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "*")
public class PostController {
    private final PostRepository postRepository;

    public PostController(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    @GetMapping
    public ResponseEntity<?> list() {
        List<Post> posts = postRepository.findAllByStatusOrderByCreatedAtEpochMsDesc("APPROVED");
        return ResponseEntity.ok(posts);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        String title = (String) body.getOrDefault("title", "");
        String subtitle = (String) body.getOrDefault("subtitle", "");
        String content = (String) body.getOrDefault("content", "");
        String imageUrl = (String) body.getOrDefault("imageUrl", "");
        String author = (String) body.getOrDefault("author", "Anonymous");
        String submittedByUserId = (String) body.getOrDefault("userId", null);
        String slugBase = title.toLowerCase().replaceAll("[^a-z0-9\s-]", "").trim().replaceAll("\s+", "-");
        String slug = slugBase;
        int i = 1;
        while (postRepository.findBySlug(slug) != null) {
            slug = slugBase + "-" + (i++);
        }
        Post p = new Post();
        p.setTitle(title);
        p.setSubtitle(subtitle);
        p.setContent(content);
        p.setAuthor(author);
        p.setImageUrl(imageUrl);
        p.setSlug(slug);
        long now = System.currentTimeMillis();
        p.setCreatedAtEpochMs(now);
        p.setCreatedAtIso(java.time.Instant.ofEpochMilli(now).toString());
        p.setUpdatedAtEpochMs(now);
        p.setStatus("PENDING");
        p.setSubmittedByUserId(submittedByUserId);
        postRepository.save(p);
        Map<String, Object> res = new HashMap<>();
        res.put("slug", slug);
        res.put("id", p.getId());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<?> getBySlug(@PathVariable String slug) {
        Post post = postRepository.findBySlug(slug);
        if (post == null || post.getStatus() == null || !"APPROVED".equals(post.getStatus())) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(post);
    }

    @GetMapping("/pending")
    public ResponseEntity<?> listPending() {
        List<Post> posts = postRepository.findAllByStatusOrderByCreatedAtEpochMsDesc("PENDING");
        return ResponseEntity.ok(posts);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable String id) {
        return postRepository.findById(id)
                .map(p -> {
                    p.setStatus("APPROVED");
                    p.setUpdatedAtEpochMs(System.currentTimeMillis());
                    postRepository.save(p);
                    return ResponseEntity.ok(Map.of("approved", true));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/decline")
    public ResponseEntity<?> decline(@PathVariable String id) {
        return postRepository.findById(id)
                .map(p -> {
                    p.setStatus("DECLINED");
                    p.setUpdatedAtEpochMs(System.currentTimeMillis());
                    postRepository.save(p);
                    return ResponseEntity.ok(Map.of("declined", true));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<?> like(@PathVariable String id) {
        return postRepository.findById(id)
                .map(p -> {
                    p.setLikeCount(p.getLikeCount() + 1);
                    postRepository.save(p);
                    return ResponseEntity.ok(Map.of("liked", true, "likeCount", p.getLikeCount()));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/unlike")
    public ResponseEntity<?> unlike(@PathVariable String id) {
        return postRepository.findById(id)
                .map(p -> {
                    p.setLikeCount(Math.max(0, p.getLikeCount() - 1));
                    postRepository.save(p);
                    return ResponseEntity.ok(Map.of("unliked", true, "likeCount", p.getLikeCount()));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}


