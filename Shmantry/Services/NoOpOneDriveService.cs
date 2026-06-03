using Shmantry.Shared.Services;

namespace Shmantry.Services;

public class NoOpOneDriveService : IOneDriveService
{
    public Task<bool?> CheckShmantryFileExistsAsync() => Task.FromResult<bool?>(null);
}
