using shmantry.Shared.Services;

namespace shmantry.Services;

public class ShmantryService : IShmantryService
{
    public bool IsAppInitialized()
    {
        return Preferences.Default.Get("db_file", string.Empty) != string.Empty;
    }

    public void Dispose()
    {
    }
}
