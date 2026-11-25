/* Reference implementation so Python can be tested before the C teammate finishes.
   Build: gcc -O3 -shared -fPIC -o lib/libengine.so c_src/engine.c   (Windows: -o lib/engine.dll) */
#include <ctype.h>
#include <stdlib.h>
#include <string.h>

#ifdef _WIN32
#define EXPORT __declspec(dllexport)
#else
#define EXPORT
#endif

static char *lower_copy(const char *s) {
    size_t n = strlen(s);
    char *out = (char *)malloc(n + 1);
    if (!out) return NULL;
    for (size_t i = 0; i < n; i++) out[i] = (char)tolower((unsigned char)s[i]);
    out[n] = '\0';
    return out;
}

static int levenshtein(const char *a, size_t la, const char *b, size_t lb) {
    int *prev = (int *)malloc((lb + 1) * sizeof(int));
    int *curr = (int *)malloc((lb + 1) * sizeof(int));
    if (!prev || !curr) { free(prev); free(curr); return -1; }
    for (size_t j = 0; j <= lb; j++) prev[j] = (int)j;
    for (size_t i = 1; i <= la; i++) {
        curr[0] = (int)i;
        for (size_t j = 1; j <= lb; j++) {
            int cost = (a[i - 1] == b[j - 1]) ? 0 : 1;
            int del = prev[j] + 1, ins = curr[j - 1] + 1, sub = prev[j - 1] + cost;
            int m = del < ins ? del : ins;
            curr[j] = m < sub ? m : sub;
        }
        int *t = prev; prev = curr; curr = t;
    }
    int result = prev[lb];
    free(prev); free(curr);
    return result;
}

/* Returns similarity in [0, 1]; higher = better match. */
EXPORT double calculate_score(const char *query, const char *title) {
    if (!query || !title) return 0.0;
    char *q = lower_copy(query), *t = lower_copy(title);
    if (!q || !t) { free(q); free(t); return 0.0; }
    size_t lq = strlen(q), lt = strlen(t);
    double score = 0.0;
    if (lq > 0 && lt > 0) {
        int d = levenshtein(q, lq, t, lt);
        size_t mx = lq > lt ? lq : lt;
        if (d >= 0) score = 1.0 - (double)d / (double)mx;
        if (strstr(t, q) != NULL) {            /* substring hit beats fuzzy distance */
            double sub = 0.85 + 0.15 * ((double)lq / (double)lt);
            if (sub > score) score = sub;
        }
    }
    free(q); free(t);
    return score;
}
