//security
import { rateLimit } from 'express-rate-limit'
// rate_limiter de 60 requete max par minute

export const rate_limiter_update = rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 40,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: 'Too many requests',
})

export const rate_limiter_login = rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: 'Too many requests',
})

export const rate_limiter_register = rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: 'Too many requests',
})

export const rate_limiter_all = rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: 'Too many requests',
})