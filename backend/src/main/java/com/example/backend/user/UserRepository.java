package com.example.backend.user;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<User, String> {
    java.util.Optional<User> findByEmail(String email);
    java.util.Optional<User> findByUsername(String username);
}


