use windows::Win32::UI::Shell::IsUserAnAdmin;

pub fn is_admin() -> bool {
    unsafe { IsUserAnAdmin().as_bool() }
}
