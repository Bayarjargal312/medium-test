package com.example.backend.post;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface PostRepository extends MongoRepository<Post, String> {
    List<Post> findAllByOrderByCreatedAtEpochMsDesc();
    Post findBySlug(String slug);
    List<Post> findAllByStatusOrderByCreatedAtEpochMsDesc(String status);
}


