import type { MediaUri, UploadTarget } from '@lovebook/core';

import { ForbiddenError, NotFoundError } from '@lib/errors.js';
import { getUploadTarget, getViewUri } from '@lib/file-service.js';
import { Err, Ok, type ServiceResult } from '@lib/result.js';

import { postRepo } from './post.repo.js';

// The access-control gate (PRD §10). The file-service is a dumb signer — anyone
// with a key can fetch a view URL — so the ONLY safe place to mint a view URL is
// behind a pair-membership check, here.

export const mediaService = {
  /** Proxy a presigned upload target. The client PUTs bytes straight to storage. */
  async uploadTarget(ext: string): Promise<ServiceResult<UploadTarget>> {
    const target = await getUploadTarget(ext);
    return Ok(target);
  },

  /** Mint a signed view URL for a post's media — only if it belongs to the caller's pair. */
  async viewUri(input: { postId: string; pairId: string }): Promise<ServiceResult<MediaUri>> {
    const post = await postRepo.findById(input.postId);
    if (!post) return Err(new NotFoundError('Post'));
    if (post.pairId.toString() !== input.pairId) {
      return Err(new ForbiddenError('Not your pair'));
    }
    if (!post.mediaKey) return Err(new NotFoundError('Media'));
    const uri = await getViewUri(post.mediaKey);
    return Ok(uri);
  },
};
