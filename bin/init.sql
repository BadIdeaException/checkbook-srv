-- This script handles the initial setup of the checkbook database. 

/** sequence key_sequence

This is the key generator that will be used when rows are inserted into application data
tables without a primary key. 
When the generator has exhausted its supply of keys, a new key series can be obtained
by calling update_key_sequence.
Normally, exhausted key series will be handled by an auto-generated trigger on
application data tables.
*/
create sequence key_sequence minvalue 0 maxvalue 1 start with 0 no cycle;

/** table key_generation
This table stores values for the next key series to be issued. This
table can only have one row. 
@column next_key The first key of the next series
@column upper_bound The last key of the next series
*/
create table if not exists key_generation (
	next_key int not null,
	upper_bound int not null);
insert into key_generation values (0,255);

/** FUNCTION key_generation_insert

Trigger function that replaces an insert on the key_generation table with an
update if a row is already present in the table.
*/
create or replace function key_generation_insert() returns trigger as
$$
declare row_present boolean;
begin
	select exists(select * from key_generation) into row_present;
	if row_present then
		update key_generation set next_key=new.next_key, upper_bound=new.upper_bound;
		return null;
	else
		return new;
	end if;
end;
$$
language plpgsql;
create trigger key_generation_insert before insert on key_generation for each row execute procedure key_generation_insert();

/**
Issues a new key series. The series issued is the one in the key_generation table.
The table is automatically updated to the series following the issued one. Currently,
series are 256 keys wide, that is, upper_bound = next_key + 256.
Note that this does <i>not</i> supply the key generator for this database with
new values. For this, look at update_key_sequence().
*/
create or replace function issue_series(out next_key int, out upper_bound int) as
$$
declare 
	SERIES_WIDTH int := 256;
	series key_generation%rowtype;
begin
	select * 
		from key_generation 
		into series;
	update key_generation 
		set next_key = key_generation.next_key + SERIES_WIDTH, upper_bound = key_generation.upper_bound + SERIES_WIDTH;
	next_key := series.next_key;
	upper_bound := series.upper_bound; 
end;
$$
language plpgsql;	

/**
Updates the key_sequence key generator to a new key series. 
*/
create or replace function update_key_sequence() returns void as
$$
declare
	series key_generation%rowtype;
begin
	select * from issue_series() into series;
	execute 'alter sequence key_sequence minvalue ' || series.next_key || ' maxvalue ' || series.upper_bound || ' start ' || series.next_key || ' restart ' || series.next_key || ' no cycle';
end;
$$
language plpgsql
security definer;

/* Initialize the internal key generator */
select update_key_sequence();

/** FUNCTION generate_key()

Generates a primary key for a row just about to be inserted into an application data table and
sets it as the value of the _id column.
If a primary key is already present (that is, _id is not null), it is left unmodified.
<p>Note: This trigger <b>must</b> execute before all other triggers.
*/
create or replace function generate_key() returns trigger as
$$

begin
	if new.id is null then 
		begin
			new.id := nextval('key_sequence');
		exception when object_not_in_prerequisite_state then
			perform update_key_sequence();
			new.id := nextval('key_sequence');
		end; 
	end if;
	return new;
end;
$$
language plpgsql;

/** FUNCTION getMonthId(in month integer, in year integer)
* Calculates the month id from the given month and year
* 	monthid = (year - 1970) * 12 + month
* @param month - The month to calculate the month id for. This is zero-based, i.e. January is zero!
* @param year- The year to calculate the month id for
*/
create or replace function getMonthId(in month integer, in year integer) returns integer 
	immutable
	language plpgsql 
	returns null on null input
	as 
$$ 
begin
	return (year - 1970)  * 12 + month;
end; 
$$;
/** FUNCTION getMonthId(in datetime timestamp without time zone)
* Helper function that will extract month and year from the timestamp,
* cast both to integer, and call getMonthId(month - 1, year) with the results
*/
create or replace function getMonthId(in datetime timestamp without time zone) returns integer 
	immutable
	language plpgsql
	returns null on null input
	as
$$
declare
	month integer;
	year integer; 
begin
	select extract('month' from datetime)::integer - 1 into month;
	select extract('year' from datetime)::integer into year;
	return getMonthId(month,year);
end;
$$;

create or replace function create_trigger(in table_name varchar(100)) returns void as
$$
begin
	execute 'create trigger "000' || table_name || '_generate_key" before insert on ' || table_name || ' for each row execute procedure generate_key();';
	return;
end;
$$
language plpgsql; 

create table if not exists categories (
	id int primary key,
	caption text);
select create_trigger('categories');

create table if not exists entries (
	id int primary key,
	datetime timestamp(0) without time zone,
	caption text,
	value integer not null,
	details text,
	category int not null references categories 
		on update cascade 
		on delete cascade);
select create_trigger('entries');

create or replace view months as
	select id, sum(value)::integer as value
	from (select getMonthId(datetime) as id, value from entries) as e
	group by e.id; 
	
create table if not exists entry_metadata (
	id int primary key references entries 
		on update cascade
		on delete cascade,
	user_chosen_category boolean);
	
create table if not exists users (
	username varchar(255) primary key,
	password text not null,
	email text not null,
	activated boolean not null default false,
	confirmation_token text unique);